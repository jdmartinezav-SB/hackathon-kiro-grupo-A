/**
 * GET /v1/sandbox/history/:appId — Handler
 *
 * Returns the last 50 sandbox history entries for a given application,
 * ordered by created_at DESC.
 *
 * The FIFO enforcement (delete oldest when count > 50) is handled at
 * insert time in sandbox-execute.ts. This endpoint is read-only.
 *
 * Validates: Requirement 3.4 (historial últimas 50 peticiones por app)
 * Validates: Property 5 (máximo 50 entradas, FIFO)
 */

import { Request, Response, NextFunction } from 'express';
import pool from './config/db';

/* ─── Response interfaces ─── */

export interface SandboxHistoryEntry {
  id: string;
  applicationId: string;
  apiVersionId: string;
  method: string;
  path: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  responseTimeMs: number;
  correlationId: string;
  createdAt: string;
}

export interface SandboxHistoryResponse {
  requests: SandboxHistoryEntry[];
  total: number;
}

/* ─── Row mapper ─── */

function mapRow(row: Record<string, unknown>): SandboxHistoryEntry {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    apiVersionId: row.api_version_id as string,
    method: row.method as string,
    path: row.path as string,
    requestHeaders: (row.request_headers ?? {}) as Record<string, string>,
    requestBody: row.request_body ?? null,
    responseStatus: row.response_status as number,
    responseHeaders: (row.response_headers ?? {}) as Record<string, string>,
    responseBody: row.response_body ?? null,
    responseTimeMs: row.response_time_ms as number,
    correlationId: row.correlation_id as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

/* ─── Route handler ─── */

export async function sandboxHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { appId } = req.params;

    if (!appId) {
      res.status(400).json({
        error: {
          code: 'SANDBOX_HIST_001',
          message: 'Missing required parameter: appId',
          correlationId: req.correlationId,
        },
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, application_id, api_version_id, method, path,
              request_headers, request_body,
              response_status, response_headers, response_body,
              response_time_ms, correlation_id, created_at
       FROM sandbox_history
       WHERE application_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [appId],
    );

    const requests = result.rows.map(mapRow);

    const response: SandboxHistoryResponse = {
      requests,
      total: requests.length,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
