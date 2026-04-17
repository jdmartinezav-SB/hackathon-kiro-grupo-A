import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    correlationId: string;
  };
  statusCode: number;
}

/**
 * Custom application error that carries an HTTP status code and
 * an internal error code for structured error responses.
 */
class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Centralized error handler — must be registered as the LAST middleware.
 * Produces a uniform JSON error envelope with correlationId for traceability.
 */
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId ?? 'unknown';

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message =
    err instanceof AppError ? err.message : 'An unexpected error occurred';
  const details = err instanceof AppError ? err.details : undefined;

  const body: ErrorResponse = {
    error: { code, message, details, correlationId },
    statusCode,
  };

  if (statusCode >= 500) {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service: process.env.SERVICE_NAME ?? 'unknown',
      correlationId,
      message: err.message,
      stack: err.stack,
    };
    process.stdout.write(JSON.stringify(log) + '\n');
  }

  res.status(statusCode).json(body);
}

export { errorHandler, AppError };
export type { ErrorResponse };
