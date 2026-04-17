import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';
import { query } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const SERVICE_NAME = process.env.SERVICE_NAME ?? 'unknown';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  businessProfile: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware.
 * Verifies signature and expiration, extracts user from token payload,
 * attaches to req.user, and checks consumer status in DB.
 *
 * Error codes:
 * - AUTH_002: Missing authentication token (401)
 * - AUTH_003: Invalid or expired token (401)
 * - AUTH_004: Account suspended or revoked (403)
 */
async function authJwt(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'AUTH_002', 'Token de autenticación requerido');
    }

    const token = authHeader.slice(7);

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError(401, 'AUTH_003', 'Token inválido o expirado');
    }

    // Verify consumer status in DB
    const result = await query<{ status: string }>(
      'SELECT status FROM consumer WHERE id = $1',
      [decoded.sub],
    );

    if (result.rows.length > 0) {
      const { status } = result.rows[0];
      if (status === 'suspended' || status === 'revoked') {
        throw new AppError(403, 'AUTH_004', 'Cuenta suspendida o revocada');
      }
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      businessProfile: decoded.businessProfile,
    };

    const log = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      service: SERVICE_NAME,
      correlationId: req.correlationId ?? 'unknown',
      message: `Authenticated user: ${decoded.sub}`,
    };
    process.stdout.write(JSON.stringify(log) + '\n');

    next();
  } catch (err) {
    next(err);
  }
}

export { authJwt };
export type { JwtPayload };
