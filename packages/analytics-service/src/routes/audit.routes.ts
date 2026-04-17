import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = Router();

const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
const SERVICE_NAME = 'analytics-service';
const MAX_EXPORT_ROWS = 100_000;
const EXPORTS_DIR = path.resolve('exports');

fs.mkdirSync(EXPORTS_DIR, { recursive: true });

interface AuditLogRequest {
  correlationId: string;
  consumerId: string;
  appId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress: string;
  responseTimeMs: number;
  apiVersionId?: string;
}

function validateAuditLogBody(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const required: Array<{ field: string; type: string }> = [
    { field: 'correlationId', type: 'string' },
    { field: 'consumerId', type: 'string' },
    { field: 'appId', type: 'string' },
    { field: 'endpoint', type: 'string' },
    { field: 'method', type: 'string' },
    { field: 'statusCode', type: 'number' },
    { field: 'ipAddress', type: 'string' },
    { field: 'responseTimeMs', type: 'number' },
  ];

  for (const { field, type } of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(field + ' is required');
    } else if (typeof body[field] !== type) {
      errors.push(field + ' must be of type ' + type);
    }
  }

  if (typeof body.method === 'string' && !VALID_HTTP_METHODS.includes((body.method as string).toUpperCase())) {
    errors.push('method must be one of: ' + VALID_HTTP_METHODS.join(', '));
  }

  if (typeof body.statusCode === 'number' && ((body.statusCode as number) < 100 || (body.statusCode as number) > 599)) {
    errors.push('statusCode must be between 100 and 599');
  }

  if (typeof body.responseTimeMs === 'number' && (body.responseTimeMs as number) < 0) {
    errors.push('responseTimeMs must be a non-negative number');
  }

  return errors;
}

// POST /v1/audit/log — Internal endpoint (no auth)
router.post('/v1/audit/log', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>;
    const validationErrors = validateAuditLogBody(body);

    if (validationErrors.length > 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', validationErrors);
    }

    const {
      correlationId,
      consumerId,
      appId,
      endpoint,
      method,
      statusCode,
      ipAddress,
      responseTimeMs,
      apiVersionId,
    } = body as unknown as AuditLogRequest;

    const upperMethod = method.toUpperCase();
    const isSuccess = statusCode < 400;
    const successIncrement = isSuccess ? 1 : 0;
    const errorIncrement = isSuccess ? 0 : 1;

    // 1. INSERT audit_log
    const insertAuditSql =
      'INSERT INTO audit_log (correlation_id, consumer_id, application_id, api_version_id, endpoint, method, status_code, ip_address, response_time_ms) ' +
      'VALUES ($1, $2, $3, $4, $5, $6::http_method, $7, $8::inet, $9) ' +
      'RETURNING *';
    const auditValues = [
      correlationId,
      consumerId,
      appId,
      apiVersionId || null,
      endpoint,
      upperMethod,
      statusCode,
      ipAddress,
      responseTimeMs,
    ];

    const auditResult = await pool.query(insertAuditSql, auditValues);
    const auditLog = auditResult.rows[0];

    // 2. UPSERT usage_metric
    const upsertMetricSql =
      'INSERT INTO usage_metric (application_id, api_version_id, metric_date, total_requests, success_count, error_count, avg_latency_ms, quota_used, updated_at) ' +
      'VALUES ($1, $2, CURRENT_DATE, 1, $3, $4, $5, 1, NOW()) ' +
      'ON CONFLICT ON CONSTRAINT uq_usage_metric_app_api_date ' +
      'DO UPDATE SET ' +
      'total_requests = usage_metric.total_requests + 1, ' +
      'success_count = usage_metric.success_count + $3, ' +
      'error_count = usage_metric.error_count + $4, ' +
      'avg_latency_ms = (usage_metric.avg_latency_ms * usage_metric.total_requests + $5) / (usage_metric.total_requests + 1), ' +
      'quota_used = usage_metric.quota_used + 1, ' +
      'updated_at = NOW()';
    const metricValues = [
      appId,
      apiVersionId || null,
      successIncrement,
      errorIncrement,
      responseTimeMs,
    ];

    await pool.query(upsertMetricSql, metricValues);

    const log = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: SERVICE_NAME,
      correlationId: req.correlationId,
      message: 'Audit log created and usage metric updated',
      auditLogId: auditLog.id,
      appId,
    };
    console.log(JSON.stringify(log));

    res.status(201).json({
      data: auditLog,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
});

// GET /v1/admin/audit/reports — Admin only
router.get(
  '/v1/admin/audit/reports',
  authMiddleware,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query as Record<string, string | undefined>;
      const consumerId = queryParams.consumerId;
      const apiId = queryParams.apiId;
      const from = queryParams.from;
      const to = queryParams.to;
      const statusCodeParam = queryParams.statusCode;
      const pageParam = queryParams.page;
      const pageSizeParam = queryParams.pageSize;

      const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(pageSizeParam || '20', 10) || 20, 1), 100);
      const offset = (page - 1) * pageSize;

      const conditions: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (consumerId) {
        conditions.push('consumer_id = $' + idx);
        idx++;
        values.push(consumerId);
      }

      if (apiId) {
        conditions.push('api_version_id = $' + idx);
        idx++;
        values.push(apiId);
      }

      if (from) {
        conditions.push('created_at >= $' + idx);
        idx++;
        values.push(from);
      }

      if (to) {
        conditions.push('created_at <= $' + idx);
        idx++;
        values.push(to);
      }

      if (statusCodeParam) {
        conditions.push('status_code = $' + idx);
        idx++;
        values.push(parseInt(statusCodeParam, 10));
      }

      const whereClause = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      const countSql = 'SELECT COUNT(*)::int AS total FROM audit_log ' + whereClause;
      const countResult = await pool.query(countSql, values);
      const total: number = countResult.rows[0].total;

      const selectSql =
        'SELECT * FROM audit_log ' + whereClause +
        ' ORDER BY created_at DESC' +
        ' LIMIT $' + idx + ' OFFSET $' + (idx + 1);
      const selectValues = [...values, pageSize, offset];
      const selectResult = await pool.query(selectSql, selectValues);

      res.status(200).json({
        records: selectResult.rows,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /v1/admin/audit/export — Admin only
router.post(
  '/v1/admin/audit/export',
  authMiddleware,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown>;
      const format = body.format as string | undefined;

      if (!format || (format !== 'csv' && format !== 'json')) {
        throw new AppError(400, 'VALIDATION_ERROR', 'format must be "csv" or "json"');
      }

      const filters = (body.filters || {}) as Record<string, unknown>;

      const conditions: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (filters.consumerId) {
        conditions.push('consumer_id = $' + idx);
        idx++;
        values.push(filters.consumerId);
      }
      if (filters.apiId) {
        conditions.push('api_version_id = $' + idx);
        idx++;
        values.push(filters.apiId);
      }
      if (filters.from) {
        conditions.push('created_at >= $' + idx);
        idx++;
        values.push(filters.from);
      }
      if (filters.to) {
        conditions.push('created_at <= $' + idx);
        idx++;
        values.push(filters.to);
      }
      if (filters.statusCode !== undefined && filters.statusCode !== null) {
        conditions.push('status_code = $' + idx);
        idx++;
        values.push(Number(filters.statusCode));
      }

      const whereClause = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      const countSql = 'SELECT COUNT(*)::int AS total FROM audit_log ' + whereClause;
      const countResult = await pool.query(countSql, values);
      const total: number = countResult.rows[0].total;

      if (total > MAX_EXPORT_ROWS) {
        const jobId = uuidv4();
        res.status(202).json({ status: 'processing', jobId });
        return;
      }

      const selectSql = 'SELECT * FROM audit_log ' + whereClause + ' ORDER BY created_at DESC';
      const selectResult = await pool.query(selectSql, values);
      const records = selectResult.rows;

      const timestamp = Date.now();
      const filename = 'audit-export-' + timestamp + '.' + format;
      const filePath = path.join(EXPORTS_DIR, filename);

      if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
      } else {
        const headers = records.length > 0 ? Object.keys(records[0]) : [];
        const csvLines = [headers.join(',')];
        for (const row of records) {
          const line = headers.map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? '"' + str.replace(/"/g, '""') + '"'
              : str;
          });
          csvLines.push(line.join(','));
        }
        fs.writeFileSync(filePath, csvLines.join('\n'), 'utf-8');
      }

      const downloadUrl = '/v1/admin/audit/exports/' + filename;

      const log = {
        timestamp: new Date().toISOString(),
        level: 'info',
        service: SERVICE_NAME,
        correlationId: req.correlationId,
        message: 'Audit export generated',
        format,
        totalRecords: total,
        filename,
      };
      console.log(JSON.stringify(log));

      res.status(200).json({ status: 'ready', downloadUrl });
    } catch (error) {
      next(error);
    }
  }
);

// GET /v1/admin/audit/exports/* — Serve exported files (admin only)
router.get(
  '/v1/admin/audit/exports/:filename',
  authMiddleware,
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const filename = req.params.filename as string;

      if (!filename || filename.includes('..') || filename.includes('/')) {
        throw new AppError(400, 'INVALID_FILENAME', 'Invalid filename');
      }

      const filePath = path.join(EXPORTS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        throw new AppError(404, 'NOT_FOUND', 'Export file not found');
      }

      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.json' ? 'application/json' : 'text/csv';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
