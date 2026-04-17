import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import pool from '../config/database';
import { authJwt } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

const BCRYPT_ROUNDS = 10;

// ── Validation schemas ──────────────────────────────────────────────

const createAppSchema = z.object({
  name: z.string().min(1, 'Application name is required'),
  description: z.string().optional(),
});

// ── GET /v1/consumers/:id ───────────────────────────────────────────

router.get(
  '/v1/consumers/:id',
  authJwt,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // BOLA protection
      if (req.user?.consumerId !== req.params.id) {
        throw new AppError(403, 'FORBIDDEN', 'You can only access your own profile');
      }

      const result = await pool.query(
        `SELECT id, email, company_name, contact_name, phone, business_profile,
                status, role, email_verified, created_at, updated_at, last_activity_at
         FROM consumer WHERE id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Consumer not found');
      }

      const row = result.rows[0];
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

// ── POST /v1/consumers/:id/apps ─────────────────────────────────────

router.post(
  '/v1/consumers/:id/apps',
  authJwt,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // BOLA protection
      if (req.user?.consumerId !== req.params.id) {
        throw new AppError(403, 'FORBIDDEN', 'You can only create apps for your own account');
      }

      const parsed = createAppSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.issues);
      }

      const { name, description } = parsed.data;

      // Insert application
      const appResult = await pool.query(
        `INSERT INTO application (consumer_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [req.params.id, name, description || null]
      );

      const appId = appResult.rows[0].id;

      // Generate credentials
      const clientId = crypto.randomUUID();
      const clientSecret = crypto.randomBytes(32).toString('hex');
      const clientSecretHash = await bcrypt.hash(clientSecret, BCRYPT_ROUNDS);

      // Insert credential
      await pool.query(
        `INSERT INTO credential (application_id, client_id, client_secret_hash, environment)
         VALUES ($1, $2, $3, 'sandbox')`,
        [appId, clientId, clientSecretHash]
      );

      // Return plain secret only on creation
      res.status(201).json({
        appId,
        clientId,
        clientSecret,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
