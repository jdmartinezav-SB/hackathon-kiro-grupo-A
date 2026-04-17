# Tasks — Dev 4: Analytics + Auditoría + Notificaciones

> **Puerto**: 3004 | **Directorio**: `packages/analytics-service/`
> **Requerimientos**: 4 (Analytics), 6 (Notificaciones), 8 (Auditoría)
> **Tablas propias**: audit_log, usage_metric, notification, notification_preference
> **Migraciones asignadas**: prefijos `009_` a `011_`
> **NO tocar**: Ningún archivo fuera de `packages/analytics-service/` y tus migraciones asignadas
> **Lee de**: consumer (Dev 1), subscription_plan (Dev 1), api_version (Dev 2)

---

## Hora 1 (0:00 - 1:00) — Auditoría + Migraciones

- [x] Crear migraciones `009_create_audit_logs.sql` (con REVOKE UPDATE/DELETE para inmutabilidad), `010_create_usage_metrics.sql`, `011_create_notifications.sql`
- [x] Crear `packages/analytics-service/src/index.ts` — Express en puerto 3004
- [x] Implementar `POST /v1/audit/log` — Insertar audit_log + upsert usage_metric del día (incrementar counters, recalcular avg_latency)
- [x] Implementar `GET /v1/admin/audit/reports` — Listar con paginación y filtros (consumerId, apiId, from/to, statusCode). Solo admin
- [x] Implementar `POST /v1/admin/audit/export` — Generar CSV o JSON sincrónicamente, retornar URL de descarga

## Hora 2 (1:00 - 2:00) — Analytics + Notificaciones

- [x] Implementar `GET /v1/analytics/dashboard/:appId` — Métricas agregadas desde usage_metric: totalRequests, successRate, errorRate, avgLatencyMs. Filtros: from, to, apiId
- [x] Implementar `GET /v1/analytics/quota/:appId` — Calcular quotaUsedPercent = (quota_used / quota_limit) × 100. Obtener límite del plan
- [x] Implementar `GET /v1/notifications` — Listar notificaciones del consumer autenticado, filtro read/unread
- [x] Implementar `PUT /v1/notifications/:id/read` — Marcar como leída
- [x] Implementar `PUT /v1/notifications/preferences` — Actualizar preferencias por tipo de evento
- [x] Implementar `POST /v1/internal/notifications/send` — Endpoint interno para crear notificación

## Hora 2:30 (2:00 - 2:30) — Seed + Tests

- [x] Agregar seed data: 30 audit_logs, 7 días de usage_metrics, 5 notificaciones demo
- [x] Test: `POST /v1/audit/log` crea registro y actualiza usage_metric
- [x] Test: `GET /v1/analytics/dashboard/:appId` retorna métricas correctas
- [x] Test: `GET /v1/notifications` retorna solo notificaciones del consumer autenticado

## Hora 3 (2:30 - 3:00) — Integración

- [x] Verificar que el sandbox (Dev 3) puede llamar a `POST /v1/audit/log` después de cada ejecución
- [x] Verificar que el frontend (Dev 5) puede mostrar dashboard y notificaciones
- [x] Corregir errores de integración
