/**
 * POST /v1/gateway/proxy/:apiId/:version/* — Gateway Simulator Handler
 *
 * Simulates an API gateway that:
 * 1. Receives a REST/JSON request
 * 2. Fetches the OpenAPI spec from DB
 * 3. Detects if the API is marked as legacy (SOAP)
 * 4. If legacy: translates JSON→SOAP, executes mock, translates SOAP response→JSON
 * 5. If REST: executes mock directly
 * 6. Returns the response with correlation ID and timing
 *
 * Validates: Requirements 3, 11 (Sandbox + Capa de Abstracción de Legados)
 * Properties: 14 (round-trip REST↔SOAP), 15 (SOAP error mapping)
 */

import { Request, Response, NextFunction } from 'express';
import pool from './config/db';
import { generateMockResponse, OpenApiSpec } from './mock-engine';
import { validateRequest } from './request-validator';
import { jsonToSoapXml, soapXmlToJson, SoapFault } from './soap-translator';

/* ─── Types ─── */

interface GatewayProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  responseTimeMs: number;
  correlationId: string;
  gateway: {
    translated: boolean;
    protocol: 'REST' | 'SOAP';
    operation?: string;
  };
}

interface SoapError extends Error {
  soapFault: SoapFault;
  httpStatus: number;
}

function isSoapError(err: unknown): err is SoapError {
  return err instanceof Error && 'soapFault' in err && 'httpStatus' in err;
}

/* ─── Helpers ─── */

function parseSpec(raw: string): OpenApiSpec {
  return JSON.parse(raw) as OpenApiSpec;
}

/**
 * Determines if an API is legacy (SOAP) based on the spec's
 * x-legacy-soap extension or category metadata.
 */
function isLegacyApi(spec: OpenApiSpec, category?: string): boolean {
  const specAny = spec as Record<string, unknown>;
  if (specAny['x-legacy-soap'] === true) return true;
  if (category && category.toLowerCase().includes('soap')) return true;
  return false;
}

/**
 * Derives a SOAP operation name from the HTTP method and path.
 * e.g. POST /v1/policies → "createPolicies", GET /v1/claims → "getClaims"
 */
function deriveOperationName(method: string, path: string): string {
  const segments = path.split('/').filter(Boolean);
  const resource = segments[segments.length - 1] ?? 'operation';
  const cleanResource = resource.replace(/[^a-zA-Z0-9]/g, '');

  const prefixMap: Record<string, string> = {
    get: 'get',
    post: 'create',
    put: 'update',
    patch: 'update',
    delete: 'delete',
  };

  const prefix = prefixMap[method.toLowerCase()] ?? 'process';
  return `${prefix}${cleanResource.charAt(0).toUpperCase()}${cleanResource.slice(1)}`;
}

/* ─── Route handler ─── */

export async function gatewayProxyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const startTime = Date.now();

  try {
    const { apiId, version } = req.params;
    const wildcardPath = '/' + (req.params[0] ?? '');
    const method = req.method;

    /* ── Fetch OpenAPI spec + category from DB ── */
    const specResult = await pool.query(
      `SELECT av.id AS api_version_id, av.openapi_spec, av.format,
              ad.category
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
          code: 'GW_001',
          message: `API version not found: ${apiId} v${version}`,
          correlationId: req.correlationId,
        },
        responseTimeMs: elapsed,
      });
      return;
    }

    const { openapi_spec: rawSpec, category } = specResult.rows[0];

    let spec: OpenApiSpec;
    try {
      spec = parseSpec(rawSpec);
    } catch {
      const elapsed = Date.now() - startTime;
      res.status(422).json({
        error: {
          code: 'GW_002',
          message: 'Failed to parse OpenAPI spec stored in database',
          correlationId: req.correlationId,
        },
        responseTimeMs: elapsed,
      });
      return;
    }

    /* ── Validate request against spec ── */
    const validationErrors = validateRequest(spec, wildcardPath, method, {
      queryParams: (req.query ?? {}) as Record<string, unknown>,
      headers: (req.headers ?? {}) as Record<string, unknown>,
      body: req.body,
    });

    if (validationErrors.length > 0) {
      const elapsed = Date.now() - startTime;
      res.status(400).json({
        error: {
          code: 'GW_003',
          message: 'Request validation failed against OpenAPI spec',
          details: validationErrors,
          correlationId: req.correlationId,
        },
        responseTimeMs: elapsed,
      });
      return;
    }

    /* ── Determine protocol and execute ── */
    const legacy = isLegacyApi(spec, category);

    if (legacy) {
      /* ── SOAP path: translate → mock → translate back ── */
      const operation = deriveOperationName(method, wildcardPath);
      const requestPayload = (req.body && typeof req.body === 'object')
        ? req.body as Record<string, unknown>
        : {};

      // JSON → SOAP XML
      const soapRequest = jsonToSoapXml(requestPayload, operation);

      // Generate mock response (still uses OpenAPI spec)
      const mockResult = generateMockResponse(spec, wildcardPath, method);

      // Simulate SOAP response by wrapping mock body as SOAP, then parsing back
      let responseBody: unknown;
      try {
        const mockBody = (mockResult.body && typeof mockResult.body === 'object')
          ? mockResult.body as Record<string, unknown>
          : {};
        const soapResponse = jsonToSoapXml(mockBody, `${operation}Response`);
        const parsed = soapXmlToJson(soapResponse);
        responseBody = parsed.data;
      } catch (err) {
        if (isSoapError(err)) {
          const elapsed = Date.now() - startTime;
          res.status(err.httpStatus).json({
            error: {
              code: 'GW_004',
              message: err.soapFault.faultString,
              soapFaultCode: err.soapFault.faultCode,
              correlationId: req.correlationId,
            },
            responseTimeMs: elapsed,
          });
          return;
        }
        throw err;
      }

      const elapsed = Date.now() - startTime;
      const response: GatewayProxyResponse = {
        statusCode: mockResult.statusCode,
        headers: { ...mockResult.headers, 'x-gateway-protocol': 'SOAP' },
        body: responseBody,
        responseTimeMs: elapsed,
        correlationId: req.correlationId,
        gateway: {
          translated: true,
          protocol: 'SOAP',
          operation,
        },
      };

      // Log the SOAP translation for traceability
      void logSyncEvent('soap_translation', {
        apiId,
        version,
        operation,
        soapRequestLength: soapRequest.length,
      });

      res.status(200).json(response);
    } else {
      /* ── REST path: direct mock execution ── */
      const mockResult = generateMockResponse(spec, wildcardPath, method);
      const elapsed = Date.now() - startTime;

      const response: GatewayProxyResponse = {
        statusCode: mockResult.statusCode,
        headers: { ...mockResult.headers, 'x-gateway-protocol': 'REST' },
        body: mockResult.body,
        responseTimeMs: elapsed,
        correlationId: req.correlationId,
        gateway: {
          translated: false,
          protocol: 'REST',
        },
      };

      res.status(200).json(response);
    }
  } catch (err) {
    next(err);
  }
}

/* ─── Sync log helper (best-effort, non-blocking) ─── */

async function logSyncEvent(
  changeType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO sync_log (change_type, change_payload, status, propagated_at, confirmed_at)
       VALUES ($1, $2, 'confirmed', NOW(), NOW())`,
      [changeType, JSON.stringify(payload)],
    );
  } catch {
    // Best-effort logging — don't fail the request
  }
}
