# Guía de Integración — Analytics Service (Dev 4)

> Puerto: **3004** | Base URL: `http://localhost:3004`

---

## 1. POST /v1/audit/log — Registrar evento de auditoría

**Auth:** Ninguna (endpoint interno)
**Consumidor principal:** Dev 3 (sandbox-service)

### Payload

```json
{
  "correlationId": "uuid-v4",
  "consumerId": "uuid-del-consumer",
  "appId": "uuid-de-la-app",
  "endpoint": "/v1/sandbox/execute",
  "method": "POST",
  "statusCode": 200,
  "ipAddress": "192.168.1.1",
  "responseTimeMs": 145,
  "apiVersionId": "uuid-opcional"
}
```

### curl

```bash
curl -X POST http://localhost:3004/v1/audit/log \
  -H "Content-Type: application/json" \
  -d '{
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "consumerId": "c1000000-0000-0000-0000-000000000001",
    "appId": "a1000000-0000-0000-0000-000000000001",
    "endpoint": "/v1/sandbox/execute",
    "method": "POST",
    "statusCode": 200,
    "ipAddress": "127.0.0.1",
    "responseTimeMs": 120
  }'
```

### Usar desde Node.js (client helper)

```typescript
import { logAuditEvent } from '@conecta2/analytics-service/src/clients/audit-client';

await logAuditEvent({
  correlationId: req.correlationId,
  consumerId: consumer.id,
  appId: app.id,
  endpoint: req.originalUrl,
  method: req.method,
  statusCode: res.statusCode,
  ipAddress: req.ip || '0.0.0.0',
  responseTimeMs: Date.now() - startTime,
});
```

---

## 2. GET /v1/analytics/dashboard/:appId — Dashboard de métricas

**Auth:** JWT requerido (header `Authorization: Bearer <token>`)

### Query params opcionales

| Param  | Tipo   | Ejemplo      |
|--------|--------|--------------|
| `from` | date   | `2025-01-01` |
| `to`   | date   | `2025-01-31` |
| `apiId`| string | uuid         |

### curl

```bash
curl http://localhost:3004/v1/analytics/dashboard/a1000000-0000-0000-0000-000000000001?from=2025-01-01&to=2025-12-31 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Respuesta

```json
{
  "totalRequests": 1500,
  "successRate": 95.33,
  "errorRate": 4.67,
  "avgLatencyMs": 142.5,
  "timeSeries": [
    { "date": "2025-01-15", "totalRequests": 200, "successCount": 190, "errorCount": 10, "avgLatencyMs": 130 }
  ]
}
```

---

## 3. GET /v1/notifications — Listar notificaciones

**Auth:** JWT requerido

### Query params opcionales

| Param    | Tipo    | Ejemplo |
|----------|---------|---------|
| `read`   | boolean | `false` |
| `page`   | number  | `1`     |
| `pageSize`| number | `20`    |

### curl

```bash
curl http://localhost:3004/v1/notifications?read=false \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 4. PUT /v1/notifications/:id/read — Marcar como leída

**Auth:** JWT requerido

```bash
curl -X PUT http://localhost:3004/v1/notifications/NOTIFICATION_UUID/read \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 5. GET /v1/analytics/quota/:appId — Consultar cuota

**Auth:** JWT requerido

```bash
curl http://localhost:3004/v1/analytics/quota/a1000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Notas rápidas

- `POST /v1/audit/log` NO requiere auth — es un endpoint interno entre servicios.
- Todos los demás endpoints requieren JWT en el header `Authorization: Bearer <token>`.
- El `Correlation-ID` se propaga automáticamente si lo envías en el header `X-Correlation-ID`.
- El audit-client helper (`src/clients/audit-client.ts`) captura errores silenciosamente para no romper el flujo principal.
