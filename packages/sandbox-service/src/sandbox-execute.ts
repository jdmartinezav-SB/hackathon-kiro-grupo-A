/**
 * POST /v1/sandbox/execute — Handler
 *
 * Obtains the OpenAPI spec from DB (api_version), validates the request,
 * generates a mock response, records the entry in sandbox_history,
 * and returns the full response (statusCode, headers, body, responseTimeMs, correlationId).
 *
 * Validates: Requirements 3.1, 3.2, 3.5, 3.7
 */

import { Request, Response, NextFunction } from 'express';
import pool from './config/db';
import { generateMockResponse, OpenApiSpec } from './mock-engine';
import { validateRequest, ValidationError } from './request-validator';

/* ─── Request / Response interfaces ─── */

interface SandboxExecuteBody {
  apiId: string;
  version: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  appId?: string;
}

interface SandboxExecuteResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  responseTimeMs: number;
  correlationId: string;
  validationErrors?: ValidationError[];
}

/* ─── Helpers ─── */

function parseSpec(raw: string, format: string): OpenApiSpec {
  if (format === 'yaml') {
    // For YAML we'd need js-yaml; for MVP we only support JSON specs stored as text
    // If the content starts with '{' treat it as JSON regardless of format flag
    if (raw.trimStart().startsWith('{')) {
      return JSON.parse(raw) as OpenApiSpec;
    }
    throw new Error('YAML specs require js-yaml; store spec as JSON for sandbox execution');
  }
  return JSON.parse(raw) as OpenApiSpec;
}

async function recordHistory(
  appId: string,
  apiVersionId: string,
  method: string,
  path: string,
  requestHeaders: Record<string, string>,
  requestBody: unknown,
  responseStatus: number,
  responseHeaders: Record<string, string>,
  responseBody: unknown,
  responseTimeMs: number,
  correlationId: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO sandbox_history
        (application_id, api_version_id, method, path,
         request_headers, request_body,
         response_status, response_headers, response_body,
         response_time_ms, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        appId,
        apiVersionId,
        method.toUpperCase(),
        path,
        JSON.stringify(requestHeaders),
        requestBody !== undefined ? JSON.stringify(requestBody) : null,
        responseStatus,
        JSON.stringify(responseHeaders),
        JSON.stringify(responseBody),
        responseTimeMs,
        correlationId,
      ],
    );

    // FIFO: keep max 50 entries per application
    await client.query(
      `DELETE FROM sandbox_history
       WHERE id IN (
         SELECT id FROM sandbox_history
         WHERE application_id = $1
         ORDER BY created_at DESC
         OFFSET 50
       )`,
      [appId],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ─── Route handler ─── */

export async function sandboxExecuteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const startTime = Date.now();

  try {
    const {
      apiId,
      version,
      method,
      path: apiPath,
      headers: reqHeaders,
      queryParams,
      body: reqBody,
      appId,
    } = req.body as SandboxExecuteBody;

    /* ── Input validation ── */
    const missingFields: string[] = [];
    if (!apiId) missingFields.push('apiId');
    if (!version) missingFields.push('version');
    if (!method) missingFields.push('method');
    if (!apiPath) missingFields.push('path');

    if (missingFields.length > 0) {
      res.status(400).json({
        error: {
          code: 'SANDBOX_001',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          correlationId: req.correlationId,
        },
      });
      return;
    }

    /* ── Fetch OpenAPI spec from DB ── */
    const specResult = await pool.query(
      `SELECT av.id AS api_version_id, av.openapi_spec, av.format
       FROM api_version av
       JOIN api_definition ad ON av.api_definition_id = ad.id
       WHERE ad.id = $1
         AND av.version_tag = $2
         AND av.status = 'active'
       LIMIT 1`,
      [apiId, version],
    );

    if (specResult.rows.length === 0) {
      const elapsed = Date.now() - startTime;
      res.status(404).json({
        error: {
          code: 'SANDBOX_002',
          message: `API version not found: ${apiId} v${version}`,
          correlationId: req.correlationId,
        },
        responseTimeMs: elapsed,
      });
      return;
    }

    const { api_version_id: apiVersionId, openapi_spec: rawSpec, format } = specResult.rows[0];

    let spec: OpenApiSpec;
    try {
      spec = parseSpec(rawSpec, format);
    } catch {
      const elapsed = Date.now() - startTime;
      res.status(422).json({
        error: {
          code: 'SANDBOX_003',
          message: 'Failed to parse OpenAPI spec stored in database',
          correlationId: req.correlationId,
        },
        responseTimeMs: elapsed,
      });
      return;
    }

    /* ── Validate request against spec ── */
    const validationErrors = validateRequest(spec, apiPath, method, {
      queryParams: queryParams ?? {},
      headers: reqHeaders ?? {},
      body: reqBody,
    });

    if (validationErrors.length > 0) {
      const elapsed = Date.now() - startTime;
      const response: SandboxExecuteResponse = {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: { error: 'Validation failed', details: validationErrors },
        responseTimeMs: elapsed,
        correlationId: req.correlationId,
        validationErrors,
      };
      res.status(200).json(response);
      return;
    }

    /* ── Generate mock response ── */
    const mockResult = generateMockResponse(spec, apiPath, method);
    const elapsed = Date.now() - startTime;

    const response: SandboxExecuteResponse = {
      statusCode: mockResult.statusCode,
      headers: mockResult.headers,
      body: mockResult.body,
      responseTimeMs: elapsed,
      correlationId: req.correlationId,
    };

    /* ── Record in history (best-effort, don't fail the request) ── */
    const effectiveAppId = appId ?? 'anonymous';
    try {
      await recordHistory(
        effectiveAppId,
        apiVersionId,
        method,
        apiPath,
        reqHeaders ?? {},
        reqBody,
        mockResult.statusCode,
        mockResult.headers,
        mockResult.body,
        elapsed,
        req.correlationId,
      );
    } catch {
      // Log but don't fail the sandbox response
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
