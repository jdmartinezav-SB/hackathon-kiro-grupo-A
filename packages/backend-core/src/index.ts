import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import consumerRoutes from './routes/consumer.routes';
import adminRoutes from './routes/admin.routes';
import { catalogProxy, sandboxProxy, analyticsProxy } from './proxy';
import pool from './config/database';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const SERVICE_NAME = 'backend-core';

// Security & parsing
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Correlation-ID
app.use(correlationIdMiddleware);

// Request logger — JSON structured logs
app.use((req: Request, _res, next) => {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    service: SERVICE_NAME,
    correlationId: req.correlationId,
    message: `${req.method} ${req.originalUrl}`,
  };
  console.log(JSON.stringify(log));
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

// Routes
app.use(authRoutes);
app.use(consumerRoutes);
app.use(adminRoutes);

// Proxy to catalog-service
app.use('/v1/catalog', catalogProxy);
app.use('/v1/admin/apis', catalogProxy);

// Proxy to sandbox-service
app.use('/v1/sandbox', sandboxProxy);

// Proxy to analytics-service
app.use('/v1/analytics', analyticsProxy);
app.use('/v1/audit', analyticsProxy);
app.use('/v1/notifications', analyticsProxy);
app.use('/v1/admin/audit', analyticsProxy);

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    service: SERVICE_NAME,
    message: `Server running on port ${PORT}`,
  };
  console.log(JSON.stringify(log));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    service: SERVICE_NAME,
    message: 'SIGTERM received — shutting down gracefully',
  };
  console.log(JSON.stringify(log));

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

export default app;
