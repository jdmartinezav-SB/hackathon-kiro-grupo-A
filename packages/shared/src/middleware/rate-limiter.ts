import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
}

interface HitRecord {
  count: number;
  resetAt: number;
}

/**
 * Basic in-memory rate limiter by IP address.
 * Configurable via options or env vars RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX_REQUESTS.
 * Returns 429 when the limit is exceeded.
 */
function rateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const maxRequests = options.maxRequests ?? Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);

  const hits = new Map<string, HitRecord>();

  // Periodic cleanup to avoid unbounded memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits) {
      if (now >= record.resetAt) {
        hits.delete(key);
      }
    }
  }, windowMs);

  // Allow the process to exit without waiting for the interval
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();

    let record = hits.get(ip);

    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      hits.set(ip, record);
    }

    record.count += 1;

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    if (record.count > maxRequests) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          correlationId: req.correlationId ?? 'unknown',
        },
        statusCode: 429,
      });
      return;
    }

    next();
  };
}

export { rateLimiter };
export type { RateLimiterOptions };
