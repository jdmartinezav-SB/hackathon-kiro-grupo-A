import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { app } from './app';

const PORT = Number(process.env.PORT ?? 3000);
const SHUTDOWN_TIMEOUT_MS = 30_000;

const server = http.createServer(app);

server.listen(PORT, () => {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'backend-core',
    correlationId: 'startup',
    message: `Server listening on port ${PORT}`,
  };
  process.stdout.write(JSON.stringify(log) + '\n');
});

// ── Graceful shutdown ──────────────────────────────────────
function gracefulShutdown(signal: string): void {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'backend-core',
    correlationId: 'shutdown',
    message: `Received ${signal}. Starting graceful shutdown…`,
  };
  process.stdout.write(JSON.stringify(log) + '\n');

  // Stop accepting new connections and finish in-flight requests
  server.close(() => {
    const doneLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'backend-core',
      correlationId: 'shutdown',
      message: 'All connections closed. Exiting.',
    };
    process.stdout.write(JSON.stringify(doneLog) + '\n');
    process.exit(0);
  });

  // Force exit after timeout to avoid hanging forever
  setTimeout(() => {
    const timeoutLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      service: 'backend-core',
      correlationId: 'shutdown',
      message: `Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms. Forcing exit.`,
    };
    process.stdout.write(JSON.stringify(timeoutLog) + '\n');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server };
