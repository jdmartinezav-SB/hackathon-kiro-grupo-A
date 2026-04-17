import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { query, AppError, authJwt } from '@conecta2/shared';
import {
  createAppSchema,
  consumerIdParamSchema,
} from '../schemas/consumers';

const SERVICE_NAME = 'backend-core';
const BCRYPT_ROUNDS = 12;

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

const consumersRouter = Router();

// All consumer routes require authentication
consumersRouter.use(authJwt);

// ── GET /v1/consumers/:id ──────────────────────────────────
// Returns consumer data + applications. BOLA protection (Property 12).
consumersRouter.get(
  '/:id',
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

      // BOLA: consumer can only access own data, admin can access any
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        throw new AppError(
          403,
          'AUTH_008',
          'No autorizado para acceder a este recurso',
        );
      }

      const consumerResult = await query<{
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
        last_activity_at: string | null;
      }>(
        `SELECT id, email, company_name, contact_name, phone,
                business_profile, status, email_verified,
                created_at, updated_at, last_activity_at
         FROM consumer WHERE id = $1`,
        [id],
      );

      if (consumerResult.rows.length === 0) {
        throw new AppError(404, 'CONSUMER_001', 'Consumidor no encontrado');
      }

      const c = consumerResult.rows[0];

      const appsResult = await query<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        created_at: string;
      }>(
        `SELECT id, name, description, status, created_at
         FROM application WHERE consumer_id = $1
         ORDER BY created_at DESC`,
        [id],
      );

      structuredLog('info', `Consumer profile retrieved: ${id}`, correlationId, {
        consumerId: id,
      });

      res.status(200).json({
        consumer: {
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
          lastActivityAt: c.last_activity_at,
        },
        applications: appsResult.rows.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          status: a.status,
          createdAt: a.created_at,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /v1/consumers/:id/apps ────────────────────────────
// Creates an application + generates client_id/client_secret.
consumersRouter.post(
  '/:id/apps',
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

      // BOLA: only the consumer themselves can create apps
      if (req.user?.id !== id) {
        throw new AppError(
          403,
          'AUTH_008',
          'No autorizado para crear aplicaciones en esta cuenta',
        );
      }

      const bodyParsed = createAppSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Datos de aplicación inválidos',
          bodyParsed.error.flatten().fieldErrors,
        );
      }

      const { name, description, redirectUrls } = bodyParsed.data;

      // Verify consumer exists
      const consumerCheck = await query<{ id: string }>(
        'SELECT id FROM consumer WHERE id = $1',
        [id],
      );

      if (consumerCheck.rows.length === 0) {
        throw new AppError(404, 'CONSUMER_001', 'Consumidor no encontrado');
      }

      // Generate credentials
      const clientId = crypto.randomUUID();
      const clientSecret = crypto.randomBytes(32).toString('hex'); // 64-char hex
      const clientSecretHash = await bcrypt.hash(clientSecret, BCRYPT_ROUNDS);

      // Insert application
      const appResult = await query<{ id: string }>(
        `INSERT INTO application (consumer_id, name, description, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [id, name, description],
      );

      const appId = appResult.rows[0].id;

      // Insert credential
      await query(
        `INSERT INTO credential (application_id, client_id, client_secret_hash, environment, status)
         VALUES ($1, $2, $3, 'sandbox', 'active')`,
        [appId, clientId, clientSecretHash],
      );

      structuredLog('info', `Application created: ${appId}`, correlationId, {
        consumerId: id,
        appId,
        redirectUrls: redirectUrls ?? [],
      });

      res.status(201).json({
        appId,
        clientId,
        clientSecret,
        environment: 'sandbox' as const,
      });
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      next(
        new AppError(500, 'APP_001', 'Error al crear la aplicación'),
      );
    }
  },
);

export { consumersRouter };
