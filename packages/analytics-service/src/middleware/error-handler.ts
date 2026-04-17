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

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';

  const log = {
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'analytics-service',
    correlationId,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };
  console.error(JSON.stringify(log));

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        correlationId,
      },
      statusCode: err.statusCode,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      correlationId,
    },
    statusCode: 500,
  };
  res.status(500).json(response);
}
