import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  correlationId,
  requestLogger,
  rateLimiter,
  healthCheck,
  errorHandler,
} from '@conecta2/shared';
import { authRouter } from './routes/auth';
import { consumersRouter } from './routes/consumers';
import { adminRouter } from './routes/admin';

const app = express();

// ── Security & parsing ─────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(helmet());
app.use(express.json());

// ── Shared middleware ──────────────────────────────────────
app.use(correlationId);
app.use(requestLogger);
app.use(rateLimiter());

// ── Health check ───────────────────────────────────────────
app.get('/health', healthCheck);

// ── Routes (v1) ────────────────────────────────────────────
app.use('/v1/auth', authRouter);
app.use('/v1/consumers', consumersRouter);
app.use('/v1/admin', adminRouter);

// ── Centralized error handler (must be last) ───────────────
app.use(errorHandler);

export { app };
