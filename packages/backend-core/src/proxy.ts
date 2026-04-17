import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { IncomingMessage } from 'http';

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
const SANDBOX_URL = process.env.SANDBOX_SERVICE_URL || 'http://localhost:3003';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004';

const SERVICE_NAME = 'backend-core';

function getCorrelationId(req: IncomingMessage): string | undefined {
  return (req as unknown as { correlationId?: string }).correlationId;
}

function buildProxyOptions(target: string, serviceName: string): Options {
  return {
    target,
    changeOrigin: true,
    on: {
      proxyReq: (_proxyReq, req) => {
        const log = {
          timestamp: new Date().toISOString(),
          level: 'info',
          service: SERVICE_NAME,
          correlationId: getCorrelationId(req),
          message: `Proxying ${req.method} ${req.url} → ${serviceName} (${target})`,
        };
        console.log(JSON.stringify(log));
      },
      error: (err, req) => {
        const log = {
          timestamp: new Date().toISOString(),
          level: 'error',
          service: SERVICE_NAME,
          correlationId: getCorrelationId(req),
          message: `Proxy error for ${req.method} ${req.url} → ${serviceName}: ${err.message}`,
        };
        console.error(JSON.stringify(log));
      },
    },
  };
}

export const catalogProxy = createProxyMiddleware(buildProxyOptions(CATALOG_URL, 'catalog-service'));
export const sandboxProxy = createProxyMiddleware(buildProxyOptions(SANDBOX_URL, 'sandbox-service'));
export const analyticsProxy = createProxyMiddleware(buildProxyOptions(ANALYTICS_URL, 'analytics-service'));
