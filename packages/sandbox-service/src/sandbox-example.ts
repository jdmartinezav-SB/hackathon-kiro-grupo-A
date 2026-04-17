/**
 * GET /v1/sandbox/apis/:apiId/example — Handler
 *
 * Returns a pre-loaded example request based on the first endpoint
 * found in the OpenAPI spec for the given API definition.
 *
 * Validates: Requirement 3.3 (pre-cargar ejemplo de petición válida con parámetros de muestra)
 */

import { Request, Response, NextFunction } from 'express';
import pool from './config/db';
import { generateFromSchema, OpenApiSpec, OpenApiSchema, PathOperation } from './mock-engine';

/* ─── Response interface ─── */

interface ExampleResponse {
  apiId: string;
  version: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  queryParams: Record<string, unknown>;
  body: unknown | null;
  mockResponse: {
    statusCode: number;
    headers: Record<string, string>;
    body: unknown;
  };
}

/* ─── Helpers ─── */

function parseSpec(raw: string): OpenApiSpec {
  return JSON.parse(raw) as OpenApiSpec;
}

function extractFirstEndpoint(spec: OpenApiSpec): { path: string; method: string; operation: PathOperation } | null {
  const paths = spec.paths;
  if (!paths) return null;

  const pathKeys = Object.keys(paths);
  if (pathKeys.length === 0) return null;

  const firstPath = pathKeys[0];
  const pathItem = paths[firstPath];

  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  for (const m of methods) {
    if (pathItem[m]) {
      return { path: firstPath, method: m.toUpperCase(), operation: pathItem[m] as PathOperation };
    }
  }

  return null;
}

function buildSampleParams(
  operation: PathOperation,
  spec: OpenApiSpec,
): { queryParams: Record<string, unknown>; pathParams: Record<string, unknown>; headers: Record<string, string> } {
  const queryParams: Record<string, unknown> = {};
  const pathParams: Record<string, unknown> = {};
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (operation.parameters) {
    for (const param of operation.parameters) {
      const value = param.schema ? generateFromSchema(param.schema, spec) : 'sample';
      if (param.in === 'query') {
        queryParams[param.name] = value;
      } else if (param.in === 'path') {
        pathParams[param.name] = value;
      } else if (param.in === 'header') {
        headers[param.name] = String(value);
      }
    }
  }

  return { queryParams, pathParams, headers };
}

function buildSampleBody(operation: PathOperation, spec: OpenApiSpec): unknown | null {
  const requestBody = operation.requestBody;
  if (!requestBody) return null;

  const jsonContent = requestBody.content?.['application/json'];
  if (!jsonContent?.schema) return null;

  return generateFromSchema(jsonContent.schema, spec);
}

function buildMockResponseBody(operation: PathOperation, spec: OpenApiSpec): { statusCode: number; body: unknown } {
  const response200 = operation.responses?.['200'];
  if (!response200) {
    return { statusCode: 200, body: {} };
  }

  const jsonContent = response200.content?.['application/json'];
  if (!jsonContent?.schema) {
    return { statusCode: 200, body: {} };
  }

  return { statusCode: 200, body: generateFromSchema(jsonContent.schema as OpenApiSchema, spec) };
}

/* ─── Route handler ─── */

export async function sandboxExampleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { apiId } = req.params;

    /* ── Fetch latest active api_version ── */
    const specResult = await pool.query(
      `SELECT av.openapi_spec, av.format, av.version_tag
       FROM api_version av
       JOIN api_definition ad ON av.api_definition_id = ad.id
       WHERE ad.id = $1
         AND av.status = 'active'
       ORDER BY av.published_at DESC
       LIMIT 1`,
      [apiId],
    );

    if (specResult.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'SANDBOX_EX_001',
          message: `No active API version found for apiId: ${apiId}`,
          correlationId: req.correlationId,
        },
      });
      return;
    }

    const { openapi_spec: rawSpec, version_tag: versionTag } = specResult.rows[0];

    /* ── Parse spec ── */
    let spec: OpenApiSpec;
    try {
      spec = parseSpec(rawSpec);
    } catch {
      res.status(422).json({
        error: {
          code: 'SANDBOX_EX_002',
          message: 'Failed to parse OpenAPI spec stored in database',
          correlationId: req.correlationId,
        },
      });
      return;
    }

    /* ── Extract first endpoint ── */
    const endpoint = extractFirstEndpoint(spec);
    if (!endpoint) {
      res.status(422).json({
        error: {
          code: 'SANDBOX_EX_003',
          message: 'OpenAPI spec contains no paths or operations',
          correlationId: req.correlationId,
        },
      });
      return;
    }

    /* ── Build sample request ── */
    const { queryParams, headers } = buildSampleParams(endpoint.operation, spec);
    const body = buildSampleBody(endpoint.operation, spec);
    const mockResp = buildMockResponseBody(endpoint.operation, spec);

    const response: ExampleResponse = {
      apiId,
      version: versionTag,
      method: endpoint.method,
      path: endpoint.path,
      headers,
      queryParams,
      body,
      mockResponse: {
        statusCode: mockResp.statusCode,
        headers: { 'content-type': 'application/json' },
        body: mockResp.body,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
