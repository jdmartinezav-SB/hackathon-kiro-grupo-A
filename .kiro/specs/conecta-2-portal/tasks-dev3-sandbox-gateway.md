# Tasks — Dev 3: Sandbox + Gateway Simulator

> **Puerto**: 3003 | **Directorio**: `packages/sandbox-service/`
> **Requerimientos**: 3 (Sandbox), 11 (Abstracción Legados)
> **Tablas propias**: sandbox_history, sync_log
> **Migraciones asignadas**: prefijos `008_`, `013_`
> **NO tocar**: Ningún archivo fuera de `packages/sandbox-service/` y tus migraciones asignadas
> **Lee de**: api_version (Dev 2), credential (Dev 1) — solo SELECT

---

## Hora 1 (0:00 - 1:00) — Mock Engine + Migraciones

- [ ] Crear migraciones `008_create_sandbox_history.sql`, `013_create_sync_logs.sql`
- [ ] Crear `packages/sandbox-service/src/index.ts` — Express en puerto 3003
- [ ] Implementar `mock-engine.ts` — Función `generateMockResponse(spec, path, method)` que genera respuestas basadas en esquemas OpenAPI (string→"lorem ipsum", number→random, boolean→true/false, array→[1 item])
- [ ] Implementar `request-validator.ts` — Función `validateRequest(spec, path, method, params)` que valida parámetros contra la spec OpenAPI

## Hora 2 (1:00 - 2:00) — Sandbox + Gateway

- [ ] Implementar `POST /v1/sandbox/execute` — Obtener spec de BD, validar request, generar mock, registrar en historial, retornar response completa (statusCode, headers, body, responseTimeMs, correlationId)
- [ ] Implementar `GET /v1/sandbox/history/:appId` — Últimas 50 entradas DESC. Al insertar: si count > 50, eliminar más antigua (FIFO)
- [ ] Implementar `GET /v1/sandbox/apis/:apiId/example` — Ejemplo pre-cargado del primer endpoint
- [ ] Implementar `soap-translator.ts` — `jsonToSoapXml(json, operation)` y `soapXmlToJson(xml)`
- [ ] Implementar `POST /v1/gateway/proxy/:apiId/:version/*` — Simular gateway: recibir REST, traducir a SOAP si legacy, ejecutar mock, traducir respuesta

## Hora 2:30 (2:00 - 2:30) — Tests

- [ ] Test: `POST /v1/sandbox/execute` con petición válida retorna mock con estructura correcta
- [ ] Test: historial retorna máximo 50 entradas
- [ ] Test: traducción JSON→SOAP→JSON preserva datos

## Hora 3 (2:30 - 3:00) — Integración

- [ ] Verificar que puede leer specs de api_version (tabla de Dev 2)
- [ ] Verificar que el frontend (Dev 5) puede ejecutar peticiones sandbox
- [ ] Corregir errores de integración
