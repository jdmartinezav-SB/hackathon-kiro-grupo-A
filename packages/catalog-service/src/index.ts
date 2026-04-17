import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
const PORT = Number(process.env.PORT_CATALOG) || 3002;

// ---------------------------------------------------------------------------
// Security & parsing middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ---------------------------------------------------------------------------
// Correlation-ID middleware
// ---------------------------------------------------------------------------
app.use((req: Request, _res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  next();
});

// ---------------------------------------------------------------------------
// Request logging middleware — structured JSON to stdout
// ---------------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'catalog-service',
      correlationId: req.headers['x-correlation-id'],
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    };
    process.stdout.write(JSON.stringify(log) + '\n');
  });

  next();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'catalog-service', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
import parserRouter from './routes/parser.routes';
import catalogRouter from './routes/catalog.routes';
import adminRouter from './routes/admin.routes';
import internalRouter from './routes/internal.routes';

app.use('/v1/internal/parser', parserRouter);
app.use('/v1/catalog/apis', catalogRouter);
app.use('/v1/admin/apis', adminRouter);
app.use('/v1/internal/versions', internalRouter);

// TODO: catalog detail routes — /apis/:id, /apis/:id/docs, /apis/:id/snippets/:lang

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';

  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'catalog-service',
    correlationId,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  };
  process.stdout.write(JSON.stringify(errorLog) + '\n');

  res.status(500).json({
    error: 'Internal Server Error',
    correlationId,
  });
});

// ---------------------------------------------------------------------------
// Server start + graceful shutdown
// ---------------------------------------------------------------------------
function startServer(port: number = PORT) {
  const server = app.listen(port, () => {
    const startLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'catalog-service',
      message: `Catalog service running on port ${port}`,
    };
    process.stdout.write(JSON.stringify(startLog) + '\n');
  });

  function gracefulShutdown(signal: string): void {
    const shutdownLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'catalog-service',
      message: `Received ${signal}. Shutting down gracefully…`,
    };
    process.stdout.write(JSON.stringify(shutdownLog) + '\n');

    server.close(() => {
      const closedLog = {
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'catalog-service',
        message: 'HTTP server closed. Exiting.',
      };
      process.stdout.write(JSON.stringify(closedLog) + '\n');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}

// Only start the server when running directly (not imported in tests)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
