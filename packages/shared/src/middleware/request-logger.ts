import { Request, Response, NextFunction } from 'express';

export function requestLogger(serviceName: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: serviceName,
      correlationId: req.correlationId,
      message: `${req.method} ${req.originalUrl}`,
    };
    console.log(JSON.stringify(log));
    next();
  };
}
