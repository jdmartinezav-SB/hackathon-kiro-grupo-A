import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { errorHandler } from './middleware/error-handler.js';
import auditRoutes from './routes/audit.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import pool from './config/database.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3004', 10);
const SERVICE_NAME = 'analytics-service';

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
app.use(auditRoutes);
app.use(analyticsRoutes);
app.use(notificationRoutes);

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
