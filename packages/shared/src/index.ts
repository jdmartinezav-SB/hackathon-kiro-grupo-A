// ── Type augmentations ──────────────────────────────────────
import './types/express';

// ── Config ──────────────────────────────────────────────────
export { pool, query } from './config/db';

// ── Middleware ──────────────────────────────────────────────
export { correlationId } from './middleware/correlation-id';
export { errorHandler, AppError } from './middleware/error-handler';
export type { ErrorResponse } from './middleware/error-handler';
export { healthCheck } from './middleware/health-check';
export { requestLogger } from './middleware/request-logger';
export { rateLimiter } from './middleware/rate-limiter';
export type { RateLimiterOptions } from './middleware/rate-limiter';
export { authJwt } from './middleware/auth-jwt';
export type { JwtPayload } from './middleware/auth-jwt';
export { requireRole } from './middleware/require-role';
