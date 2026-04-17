import { Request, Response, NextFunction } from 'express';

/**
 * JSON structured request logger.
 * Writes one log line per request to stdout with the fields required
 * by Property 20: timestamp, level, service, correlationId, message.
 */
function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: process.env.SERVICE_NAME ?? 'unknown',
      correlationId: req.correlationId ?? 'unknown',
      message: `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    };
    process.stdout.write(JSON.stringify(log) + '\n');
  });

  next();
}

export { requestLogger };
