import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import { authJwt, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

// ── Validation schemas ──────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked']),
  reason: z.string().min(1, 'Reason is required'),
});

// ── GET /v1/admin/consumers ─────────────────────────────────────────

router.get(
  '/v1/admin/consumers',
  authJwt,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const offset = (page - 1) * limit;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      // Build dynamic WHERE clauses
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`c.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (search) {
        conditions.push(`(c.company_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM consumer c ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Fetch consumers with app count
      const dataParams = [...params, limit, offset];
      const result = await pool.query(
        `SELECT c.id, c.email, c.company_name, c.contact_name, c.phone,
                c.business_profile, c.status, c.role, c.email_verified,
                c.created_at, c.updated_at, c.last_activity_at,
                COUNT(a.id)::int AS app_count
         FROM consumer c
         LEFT JOIN application a ON a.consumer_id = c.id
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        dataParams
      );

      const consumers = result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        companyName: row.company_name,
        contactName: row.contact_name,
        phone: row.phone,
        businessProfile: row.business_profile,
        status: row.status,
        role: row.role,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastActivityAt: row.last_activity_at,
        appCount: row.app_count,
      }));

      res.json({ consumers, total, page, limit });
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /v1/admin/consumers/:id/status ──────────────────────────────

router.put(
  '/v1/admin/consumers/:id/status',
  authJwt,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.issues);
      }

      const { status, reason } = parsed.data;
      const targetId = req.params.id;

      // Get current consumer state
      const current = await pool.query(
        'SELECT id, status, role, email, company_name, business_profile FROM consumer WHERE id = $1',
        [targetId]
      );

      if (current.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Consumer not found');
      }

      const previousState = { status: current.rows[0].status };

      // Update status
      const updated = await pool.query(
        `UPDATE consumer SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, company_name, contact_name, phone,
                   business_profile, status, role, email_verified,
                   created_at, updated_at, last_activity_at`,
        [status, targetId]
      );

      // Log admin action
      await pool.query(
        `INSERT INTO admin_action_log (admin_id, target_id, action, reason, previous_state, new_state)
         VALUES ($1, $2, 'status_change', $3, $4, $5)`,
        [
          req.user?.consumerId,
          targetId,
          reason,
          JSON.stringify(previousState),
          JSON.stringify({ status }),
        ]
      );

      const row = updated.rows[0];
      res.json({
        id: row.id,
        email: row.email,
        companyName: row.company_name,
        contactName: row.contact_name,
        phone: row.phone,
        businessProfile: row.business_profile,
        status: row.status,
        role: row.role,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastActivityAt: row.last_activity_at,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /v1/admin/consumers/:id/apps ────────────────────────────────

router.get(
  '/v1/admin/consumers/:id/apps',
  authJwt,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT id, consumer_id, name, description, status, created_at
         FROM application
         WHERE consumer_id = $1
         ORDER BY created_at DESC`,
        [req.params.id]
      );

      const apps = result.rows.map((row) => ({
        id: row.id,
        consumerId: row.consumer_id,
        name: row.name,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
      }));

      res.json({ apps });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
