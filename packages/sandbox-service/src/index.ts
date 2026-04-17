import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import pool from './config/db';
import { sandboxExecuteHandler } from './sandbox-execute';
import { sandboxHistoryHandler } from './sandbox-history';
import { sandboxExampleHandler } from './sandbox-example';
import { gatewayProxyHandler } from './gateway-proxy';

const app = express();
const PORT = parseInt(process.env.PORT || '3003', 10);

/* ─── Structured Logger ─── */
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  correlationId?: string;
  message: string;
}

function log(level: string, message: string, correlationId?: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'sandbox-service',
    correlationId,
    message,
  };
  process.stdout.write(JSON.stringify(entry) + '\n');
}

/* ─── Middleware: Correlation-ID ─── */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

/* ─── Global Middleware ─── */
app.use(helmet());
app.use(cors());
app.use(express.json());

/* ─── Health Check ─── */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'sandbox-service', timestamp: new Date().toISOString() });
});

/* ─── Route Placeholders (implemented in later tasks) ─── */
app.post('/v1/sandbox/execute', sandboxExecuteHandler);

app.get('/v1/sandbox/history/:appId', sandboxHistoryHandler);

app.get('/v1/sandbox/apis/:apiId/example', sandboxExampleHandler);

app.all('/v1/gateway/proxy/:apiId/:version/*', gatewayProxyHandler);

/* ─── Centralized Error Handler ─── */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  log('error', err.message, req.correlationId);
  res.status(500).json({
    error: 'Internal Server Error',
    correlationId: req.correlationId,
  });
});

/* ─── Server Start & Graceful Shutdown ─── */
let server: ReturnType<typeof app.listen> | null = null;

function startServer(): ReturnType<typeof app.listen> {
  server = app.listen(PORT, () => {
    log('info', `Sandbox service running on port ${PORT}`);
  });
  return server;
}

function gracefulShutdown(signal: string): void {
  log('info', `Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      log('info', 'HTTP server closed');
      await pool.end();
      log('info', 'Database pool closed');
      process.exit(0);
    });
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/* Start only when run directly (not imported for testing) */
if (require.main === module) {
  startServer();
}

export { app, startServer };
