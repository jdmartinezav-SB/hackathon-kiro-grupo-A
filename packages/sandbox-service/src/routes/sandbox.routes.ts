import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authJwt } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { generateMockResponse } from '../mock/mock-engine';
import { validateRequest } from '../mock/request-validator';
import pool from '../config/database';

const router = Router();

/* ── Zod Schemas ── */

const executeBodySchema = z.object({
  apiId: z.string().min(1, 'apiId is required'),
  version: z.string().min(1, 'version is required'),
  method: z.string().min(1, 'method is required'),
  path: z.string().min(1, 'path is required'),
  headers: z.record(z.string()).optional(),
  body: z.record(z.unknown()).optional(),
});

/* ── POST /v1/sandbox/execute ── */

router.post(
  '/v1/sandbox/execute',
  authJwt,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = executeBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.issues);
      }

      const { apiId, version, method, path: reqPath, headers: reqHeaders, body: reqBody } = parsed.data;

      // Look up api_version by joining api_definition and api_version
      const versionResult = await pool.query(
        `SELECT av.id AS version_id, av.openapi_spec
         FROM api_definition ad
         JOIN api_version av ON av.api_definition_id = ad.id
         WHERE ad.id = $1 AND av.version_tag = $2
         LIMIT 1`,
        [apiId, version]
      );

      if (versionResult.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', `API version '${version}' not found for API '${apiId}'`);
      }

      const { version_id: apiVersionId, openapi_spec: openapiSpec } = versionResult.rows[0];

      // Parse the OpenAPI spec
      let spec: Record<string, unknown>;
      if (typeof openapiSpec === 'string') {
        spec = JSON.parse(openapiSpec);
      } else {
        spec = openapiSpec as Record<string, unknown>;
      }

      // Validate request against spec (log warnings, don't block)
      const validationErrors = validateRequest(spec, reqPath, method, {
        headers: reqHeaders,
        body: reqBody,
      });

      if (validationErrors.length > 0) {
        const log = {
          timestamp: new Date().toISOString(),
          level: 'warn',
          service: 'sandbox-service',
          correlationId: req.correlationId,
          message: 'Request validation warnings',
          details: validationErrors,
        };
        console.warn(JSON.stringify(log));
      }

      // Generate mock response
      const mockResponse = generateMockResponse(spec, reqPath, method);
      const correlationId = req.correlationId || uuidv4();

      // Insert into sandbox_history
      await pool.query(
        `INSERT INTO sandbox_history
          (application_id, api_version_id, method, path,
           request_headers, request_body,
           response_status, response_headers, response_body,
           response_time_ms, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          apiId,
          apiVersionId,
          method.toUpperCase(),
          reqPath,
          JSON.stringify(reqHeaders || {}),
          reqBody ? JSON.stringify(reqBody) : null,
          mockResponse.statusCode,
          JSON.stringify(mockResponse.headers),
          JSON.stringify(mockResponse.body),
          mockResponse.responseTimeMs,
          correlationId,
        ]
      );

      res.json({
        statusCode: mockResponse.statusCode,
        headers: mockResponse.headers,
        body: mockResponse.body,
        responseTimeMs: mockResponse.responseTimeMs,
        correlationId,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ── GET /v1/sandbox/history/:appId ── */

router.get(
  '/v1/sandbox/history/:appId',
  authJwt,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appId } = req.params;

      const result = await pool.query(
        `SELECT id, application_id, api_version_id, method, path,
                request_headers, request_body,
                response_status, response_headers, response_body,
                response_time_ms, correlation_id, created_at
         FROM sandbox_history
         WHERE application_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [appId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

/* ── GET /v1/sandbox/apis/:apiId/example ── */

router.get(
  '/v1/sandbox/apis/:apiId/example',
  authJwt,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apiId } = req.params;

      // Get the latest active api_version for this API definition
      const versionResult = await pool.query(
        `SELECT av.openapi_spec, av.version_tag
         FROM api_version av
         WHERE av.api_definition_id = $1 AND av.status = 'active'
         ORDER BY av.created_at DESC
         LIMIT 1`,
        [apiId]
      );

      if (versionResult.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', `No active version found for API '${apiId}'`);
      }

      const { openapi_spec: openapiSpec, version_tag: versionTag } = versionResult.rows[0];

      let spec: Record<string, unknown>;
      if (typeof openapiSpec === 'string') {
        spec = JSON.parse(openapiSpec);
      } else {
        spec = openapiSpec as Record<string, unknown>;
      }

      const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
      if (!paths || Object.keys(paths).length === 0) {
        throw new AppError(404, 'NO_ENDPOINTS', 'No endpoints found in the API spec');
      }

      // Take the first endpoint
      const firstPath = Object.keys(paths)[0];
      const pathItem = paths[firstPath];
      const firstMethod = Object.keys(pathItem).find((m) =>
        ['get', 'post', 'put', 'delete', 'patch'].includes(m)
      );

      if (!firstMethod) {
        throw new AppError(404, 'NO_METHODS', 'No HTTP methods found for the first endpoint');
      }

      const operation = pathItem[firstMethod] as Record<string, unknown>;

      // Generate example request body from schema if available
      let exampleBody: unknown = null;
      const requestBody = operation.requestBody as Record<string, unknown> | undefined;
      if (requestBody) {
        const content = requestBody.content as Record<string, Record<string, unknown>> | undefined;
        if (content) {
          const jsonContent = content['application/json'];
          if (jsonContent?.schema) {
            const { generateMockResponse: genMock } = await import('../mock/mock-engine');
            // Use the mock engine to generate a sample body
            const sampleSpec: Record<string, unknown> = {
              paths: {
                [firstPath]: {
                  [firstMethod]: {
                    responses: {
                      '200': {
                        content: {
                          'application/json': {
                            schema: jsonContent.schema,
                          },
                        },
                      },
                    },
                  },
                },
              },
            };
            const sampleResponse = genMock(sampleSpec, firstPath, firstMethod);
            exampleBody = sampleResponse.body;
          }
        }
      }

      // Build example headers
      const exampleHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const parameters = operation.parameters as Array<Record<string, unknown>> | undefined;
      if (parameters) {
        for (const param of parameters) {
          if ((param.in as string) === 'header') {
            exampleHeaders[param.name as string] = (param.example as string) || 'example-value';
          }
        }
      }

      res.json({
        apiId,
        version: versionTag,
        method: firstMethod.toUpperCase(),
        path: firstPath,
        headers: exampleHeaders,
        body: exampleBody,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
