import { Request, Response } from 'express';

/**
 * GET /health — lightweight health-check endpoint.
 * Returns 200 with service status, uptime and timestamp.
 */
function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

export { healthCheck };
