import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const HEADER_NAME = 'x-correlation-id';

/**
 * Generates or propagates a Correlation-ID (UUID v4) for every request.
 * If the incoming request already carries the header, it is reused;
 * otherwise a new one is created. The ID is attached to `req.correlationId`
 * and echoed back in the response header.
 */
function correlationId(req: Request, _res: Response, next: NextFunction): void {
  const id = (req.headers[HEADER_NAME] as string) || uuidv4();

  req.correlationId = id;
  _res.setHeader(HEADER_NAME, id);

  next();
}

export { correlationId };
