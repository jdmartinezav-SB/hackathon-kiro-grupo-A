import axios from 'axios';

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004';

interface AuditLogPayload {
  correlationId: string;
  consumerId: string;
  appId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress: string;
  responseTimeMs: number;
  apiVersionId?: string;
}

export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  try {
    await axios.post(`${ANALYTICS_SERVICE_URL}/v1/audit/log`, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log but don't throw — audit logging should not break the main flow
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'audit-client',
      message: 'Failed to log audit event',
      correlationId: payload.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}

export type { AuditLogPayload };
