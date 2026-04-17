import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, AppError } from '@conecta2/shared';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from '../schemas/auth';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
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

const authRouter = Router();

// ── POST /v1/auth/register ─────────────────────────────────
authRouter.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? 'unknown';
      const parsed = registerSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Datos de registro inválidos', parsed.error.flatten().fieldErrors);
      }

      const { email, password, companyName, businessProfile, contactName, phone } = parsed.data;

      // Check duplicate email
      const existing = await query<{ id: string }>(
        'SELECT id FROM consumer WHERE email = $1',
        [email],
      );

      if (existing.rows.length > 0) {
        throw new AppError(409, 'AUTH_001', 'El email ya se encuentra registrado');
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await query<{ id: string }>(
        `INSERT INTO consumer (email, password_hash, company_name, business_profile, contact_name, phone, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', false)
         RETURNING id`,
        [email, passwordHash, companyName, businessProfile, contactName, phone ?? null],
      );

      const consumerId = result.rows[0].id;

      structuredLog('info', `Consumer registered: ${consumerId}`, correlationId, { consumerId });

      res.status(201).json({
        consumerId,
        message: 'Correo de verificación enviado',
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /v1/auth/login ────────────────────────────────────
authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? 'unknown';
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Datos de login inválidos', parsed.error.flatten().fieldErrors);
      }

      const { email, password } = parsed.data;

      // Generic message to avoid revealing whether email exists
      const genericError = new AppError(401, 'AUTH_006', 'Credenciales inválidas');

      const result = await query<{
        id: string;
        email: string;
        password_hash: string;
        status: string;
        business_profile: string;
        company_name: string;
        contact_name: string;
      }>(
        'SELECT id, email, password_hash, status, business_profile, company_name, contact_name FROM consumer WHERE email = $1',
        [email],
      );

      if (result.rows.length === 0) {
        throw genericError;
      }

      const consumer = result.rows[0];

      const passwordMatch = await bcrypt.compare(password, consumer.password_hash);
      if (!passwordMatch) {
        throw genericError;
      }

      // Check consumer status
      if (consumer.status !== 'active') {
        throw new AppError(403, 'AUTH_007', 'La cuenta no está activa');
      }

      // Generate tokens
      const tokenPayload = {
        sub: consumer.id,
        email: consumer.email,
        role: 'consumer' as const,
        businessProfile: consumer.business_profile,
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      });

      const refreshToken = jwt.sign(
        { sub: consumer.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY },
      );

      // Update last_activity_at
      await query('UPDATE consumer SET last_activity_at = NOW() WHERE id = $1', [consumer.id]);

      structuredLog('info', `Consumer logged in: ${consumer.id}`, correlationId, {
        consumerId: consumer.id,
      });

      res.status(200).json({
        accessToken,
        refreshToken,
        consumer: {
          id: consumer.id,
          email: consumer.email,
          companyName: consumer.company_name,
          contactName: consumer.contact_name,
          businessProfile: consumer.business_profile,
          status: consumer.status,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /v1/auth/verify-email ─────────────────────────────
authRouter.post(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const correlationId = req.correlationId ?? 'unknown';

      // MVP: accept consumerId from body or query param "token"
      const consumerId = req.body?.consumerId ?? req.query?.token;

      const parsed = verifyEmailSchema.safeParse({ consumerId });
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Token o consumerId inválido', parsed.error.flatten().fieldErrors);
      }

      const result = await query<{ id: string; email_verified: boolean }>(
        'SELECT id, email_verified FROM consumer WHERE id = $1',
        [parsed.data.consumerId],
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Consumidor no encontrado');
      }

      if (result.rows[0].email_verified) {
        res.status(200).json({ message: 'El email ya fue verificado previamente' });
        return;
      }

      await query(
        `UPDATE consumer SET email_verified = true, status = 'active', updated_at = NOW() WHERE id = $1`,
        [parsed.data.consumerId],
      );

      structuredLog('info', `Email verified for consumer: ${parsed.data.consumerId}`, correlationId, {
        consumerId: parsed.data.consumerId,
      });

      res.status(200).json({ message: 'Email verificado exitosamente' });
    } catch (err) {
      next(err);
    }
  },
);

export { authRouter };
