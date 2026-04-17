import { Router, Request, Response, NextFunction } from 'express';
import { query, AppError, authJwt, requireRole } from '@conecta2/shared';
import {
  updateStatusSchema,
  consumerListQuerySchema,
  consumerIdParamSchema,
} from '../schemas/consumers';

const SERVICE_NAME = 'backend-core';

function structuredLog(
  level: string,
  message: string,
  correlationId: string,
  extra?: Record<string, unknown>,
): void {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    correlationId,
    message,
    ...extra,
  };
  process.stdout.write(JSON.stringify(log) + '\n');
}

const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authJwt, requireRole('admin'));

// ── GET /v1/admin/consumers ────────────────────────────────
// Lists consumers with pagination, filters, and app count (Req 7.1).
adminRouter.get(
  '/consumers',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? 'unknown';
      const queryParsed = consumerListQuerySchema.safeParse(req.query);

      if (!queryParsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Parámetros de consulta inválidos',
          queryParsed.error.flatten().fieldErrors,
        );
      }

      const { page, pageSize, status, businessProfile, search } =
        queryParsed.data;
      const offset = (page - 1) * pageSize;

      // Build dynamic WHERE clauses
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`c.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (businessProfile) {
        conditions.push(`c.business_profile = $${paramIndex}`);
        params.push(businessProfile);
        paramIndex++;
      }

      if (search) {
        conditions.push(
          `(c.company_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`,
        );
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total
      const countResult = await query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM consumer c ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].total, 10);

      // Fetch consumers with app count
      const consumersResult = await query<{
        id: string;
        email: string;
        company_name: string;
        contact_name: string;
        phone: string | null;
        business_profile: string;
        status: string;
        email_verified: boolean;
        created_at: string;
        updated_at: string;
        app_count: string;
      }>(
        `SELECT c.id, c.email, c.company_name, c.contact_name, c.phone,
                c.business_profile, c.status, c.email_verified,
                c.created_at, c.updated_at,
                COUNT(a.id)::TEXT AS app_count
         FROM consumer c
         LEFT JOIN application a ON a.consumer_id = c.id
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pageSize, offset],
      );

      structuredLog('info', `Admin listed consumers: page=${page}`, correlationId, {
        total,
        page,
        pageSize,
      });

      res.status(200).json({
        consumers: consumersResult.rows.map((c) => ({
          id: c.id,
          email: c.email,
          companyName: c.company_name,
          contactName: c.contact_name,
          phone: c.phone,
          businessProfile: c.business_profile,
          status: c.status,
          emailVerified: c.email_verified,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          appCount: parseInt(c.app_count, 10),
        })),
        total,
        page,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── PUT /v1/admin/consumers/:id/status ─────────────────────
// Changes consumer status + registers in admin_action_log (Req 7.3, 7.5).
adminRouter.put(
  '/consumers/:id/status',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? 'unknown';
      const paramParsed = consumerIdParamSchema.safeParse(req.params);

      if (!paramParsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'ID de consumidor inválido',
          paramParsed.error.flatten().fieldErrors,
        );
      }

      const { id } = paramParsed.data;

      const bodyParsed = updateStatusSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Datos de actualización inválidos',
          bodyParsed.error.flatten().fieldErrors,
        );
      }

      const { status, reason } = bodyParsed.data;

      // Verify consumer exists and get current status
      const consumerResult = await query<{
        id: string;
        email: string;
        company_name: string;
        contact_name: string;
        business_profile: string;
        status: string;
      }>(
        `SELECT id, email, company_name, contact_name, business_profile, status
         FROM consumer WHERE id = $1`,
        [id],
      );

      if (consumerResult.rows.length === 0) {
        throw new AppError(404, 'CONSUMER_001', 'Consumidor no encontrado');
      }

      const consumer = consumerResult.rows[0];
      const previousStatus = consumer.status;

      // Validate status transition
      if (previousStatus === status) {
        throw new AppError(
          400,
          'ADMIN_001',
          `El consumidor ya tiene el status: ${status}`,
        );
      }

      // Update consumer status
      await query(
        `UPDATE consumer SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, id],
      );

      // Req 7.3: When suspending, all apps should also be suspended
      if (status === 'suspended') {
        await query(
          `UPDATE application SET status = 'suspended' WHERE consumer_id = $1`,
          [id],
        );
      }

      // Req 7.5: Register action in admin_action_log
      const adminId = req.user?.id ?? 'unknown';
      await query(
        `INSERT INTO admin_action_log
           (admin_id, action_type, target_consumer_id, reason, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          adminId,
          `status_change_${status}`,
          id,
          reason,
          JSON.stringify({
            previousStatus,
            newStatus: status,
            correlationId,
          }),
        ],
      );

      structuredLog(
        'info',
        `Admin changed consumer status: ${id} ${previousStatus} → ${status}`,
        correlationId,
        { consumerId: id, previousStatus, newStatus: status, adminId },
      );

      res.status(200).json({
        consumer: {
          id: consumer.id,
          email: consumer.email,
          companyName: consumer.company_name,
          contactName: consumer.contact_name,
          businessProfile: consumer.business_profile,
          status,
          previousStatus,
        },
        message: `Status actualizado a ${status}`,
      });
    } catch (err) {
      next(err);
    }
  },
);

export { adminRouter };
