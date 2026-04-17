import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = req.correlationId || 'unknown';
  const log = {
    timestamp: new Date().toISOString(),
    level: 'error',
    correlationId,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };
  console.error(JSON.stringify(log));

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details, correlationId },
      statusCode: err.statusCode,
    });
    return;
  }

  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred', correlationId },
    statusCode: 500,
  });
}
