import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

/**
 * Factory function that returns middleware to enforce role-based access control.
 * Must be used AFTER authJwt middleware (requires req.user to be set).
 *
 * Usage: router.get('/admin/resource', authJwt, requireRole('admin'), handler)
 *
 * Error codes:
 * - AUTH_005: Insufficient permissions (403)
 */
function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      next(new AppError(401, 'AUTH_002', 'Token de autenticación requerido'));
      return;
    }

    if (!roles.includes(user.role)) {
      next(
        new AppError(
          403,
          'AUTH_005',
          `Permisos insuficientes. Se requiere rol: ${roles.join(' o ')}`,
        ),
      );
      return;
    }

    next();
  };
}

export { requireRole };
