# Tareas de Implementación — Conecta 2.0 Portal

> **Hackathon**: 5 desarrolladores, 3 horas, solución funcional
> **Estrategia**: Cada dev trabaja en su directorio sin tocar los demás. Integración al final.
> **Regla de oro**: Nadie modifica archivos fuera de su módulo excepto `packages/shared/migrations/` (prefijos asignados).

---

## Fase 0 — Setup Compartido (Primeros 15 min — Todos juntos)

- [ ] 0.1 Inicializar monorepo con npm workspaces y estructura de directorios
  - [ ] 0.1.1 Crear `package.json` raíz con workspaces: `packages/*`
  - [ ] 0.1.2 Crear directorios: `packages/shared`, `packages/backend-core`, `packages/catalog-service`, `packages/sandbox-service`, `packages/analytics-service`, `packages/frontend`
  - [ ] 0.1.3 Crear `package.json` en cada paquete con nombre `@conecta2/{nombre}` y dependencia a `@conecta2/shared`
- [ ] 0.2 Configurar `packages/shared` con tipos, middleware y migraciones
  - [ ] 0.2.1 Crear interfaces TypeScript compartidas en `packages/shared/src/types/`: `Consumer`, `Application`, `Credential`, `ApiDefinition`, `ApiVersion`, `AuditLog`, `Notification`, `SubscriptionPlan`
  - [ ] 0.2.2 Crear middleware compartido en `packages/shared/src/middleware/`: `correlation-id.ts`, `error-handler.ts`, `request-logger.ts`, `health-check.ts`, `auth-jwt.ts`
  - [ ] 0.2.3 Crear `packages/shared/src/db.ts` con pool de conexión PostgreSQL configurable por variable de entorno
- [ ] 0.3 Crear `docker-compose.yml` con PostgreSQL 15 y Redis
  - [ ] 0.3.1 Servicio `postgres` con volumen persistente, puerto 5432, base de datos `conecta2`
  - [ ] 0.3.2 Servicio `redis` con puerto 6379
  - [ ] 0.3.3 Script `init-db.sh` que ejecuta todas las migraciones de `packages/shared/migrations/` en orden numérico
- [ ] 0.4 Crear archivo `.env.example` con variables de entorno compartidas
- [ ] 0.5 Crear `tsconfig.json` base y `jest.config.ts` base en la raíz del monorepo

---

## Dev 1 — Backend Core + Auth (Reqs 1, 7, 10)

**Directorio**: `packages/backend-core/`
**Puerto**: 3000
**Tablas propias**: `consumer`, `application`, `credential`, `subscription_plan`, `subscription_api`, `admin_action_log`
**Migraciones**: `001_` a `004_`, `012_`

- [ ] 1.1 Crear migraciones SQL para tablas propias
  - [ ] 1.1.1 `packages/shared/migrations/001_create_consumers.sql` — tabla `consumer` con campos: id (uuid PK), email (unique), password_hash, company_name, contact_name, phone, business_profile (enum), status (enum: active/suspended/revoked), email_verified (boolean), created_at, updated_at, last_activity_at
  - [ ] 1.1.2 `packages/shared/migrations/002_create_applications.sql` — tabla `application` con FK a consumer, campos: id, consumer_id, name, description, status (enum), created_at
  - [ ] 1.1.3 `packages/shared/migrations/003_create_credentials.sql` — tabla `credential` con FK a application, campos: id, application_id, client_id (unique), client_secret_hash, environment (enum: sandbox/production), status, created_at, revoked_at
  - [ ] 1.1.4 `packages/shared/migrations/004_create_subscription_plans.sql` — tablas `subscription_plan` y `subscription_api` con FK a api_version
  - [ ] 1.1.5 `packages/shared/migrations/012_create_admin_action_logs.sql` — tabla `admin_action_log`
- [ ] 1.2 Crear servidor Express con configuración base
  - [ ] 1.2.1 `packages/backend-core/src/index.ts` — Express app en puerto 3000 con middleware compartido (correlation-id, error-handler, request-logger, health-check)
  - [ ] 1.2.2 Configurar CORS para permitir requests del frontend (puerto 5173)
- [ ] 1.3 Implementar endpoints de autenticación
  - [ ] 1.3.1 `POST /v1/auth/register` — Validar datos con Zod, hashear password con bcrypt, insertar consumer, retornar consumerId (simular envío de correo con log)
  - [ ] 1.3.2 `POST /v1/auth/login` — Validar credenciales, generar JWT con jsonwebtoken (payload: consumerId, email, role, businessProfile), retornar accessToken + consumer summary
  - [ ] 1.3.3 `POST /v1/auth/verify-email` — Recibir token de verificación, marcar email_verified=true, retornar 200
  - [ ] 1.3.4 Middleware `authJwt` en `packages/shared/src/middleware/auth-jwt.ts` — Verificar firma JWT, expiración, extraer payload y adjuntar a `req.user`
  - [ ] 1.3.5 Middleware `requireRole` — Verificar que `req.user.role` sea 'admin' para rutas administrativas
- [ ] 1.4 Implementar CRUD de consumidores y aplicaciones
  - [ ] 1.4.1 `GET /v1/consumers/:id` — Retornar datos del consumidor autenticado (solo puede ver sus propios datos — protección BOLA)
  - [ ] 1.4.2 `POST /v1/consumers/:id/apps` — Crear aplicación, generar client_id (uuid) y client_secret (random 32 bytes hex), retornar credenciales sandbox
  - [ ] 1.4.3 `POST /v1/consumers/:id/apps/:appId/credentials` — Regenerar credenciales para una aplicación existente
- [ ] 1.5 Implementar endpoints de administración de aliados
  - [ ] 1.5.1 `GET /v1/admin/consumers` — Listar consumidores con paginación, filtros por status/nombre/email, incluir conteo de apps
  - [ ] 1.5.2 `PUT /v1/admin/consumers/:id/status` — Cambiar status (active/suspended/revoked), registrar en admin_action_log con motivo, retornar consumer actualizado
  - [ ] 1.5.3 `GET /v1/admin/consumers/:id/apps` — Listar aplicaciones de un consumidor específico
- [ ] 1.6 Crear seed data para demo
  - [ ] 1.6.1 En `packages/shared/migrations/014_seed_data.sql`: 2 consumidores demo (uno activo, uno suspendido), 3 aplicaciones, 1 plan de suscripción con 3 APIs asignadas, 1 usuario admin
- [ ] 1.7 Tests mínimos funcionales
  - [ ] 1.7.1 Test: `POST /v1/auth/register` con datos válidos retorna 201 y consumerId
  - [ ] 1.7.2 Test: `POST /v1/auth/login` con credenciales válidas retorna JWT
  - [ ] 1.7.3 Test: `PUT /v1/admin/consumers/:id/status` cambia status y registra en admin_action_log

---

## Dev 2 — Catálogo + Docs + Parser OpenAPI (Reqs 2, 5, 16, 14)

**Directorio**: `packages/catalog-service/`
**Puerto**: 3002
**Tablas propias**: `api_definition`, `api_version`, `sunset_plan`
**Migraciones**: `005_` a `007_`

- [ ] 2.1 Crear migraciones SQL para tablas propias
  - [ ] 2.1.1 `packages/shared/migrations/005_create_api_definitions.sql` — tabla `api_definition` con campos: id (uuid PK), name, description, category, status (enum: active/deprecated/maintenance), created_at, updated_at
  - [ ] 2.1.2 `packages/shared/migrations/006_create_api_versions.sql` — tabla `api_version` con FK a api_definition, campos: id, api_definition_id, version_tag, openapi_spec (text), format (enum: yaml/json), status (enum: active/deprecated/retired), semantic_metadata (jsonb), published_at
  - [ ] 2.1.3 `packages/shared/migrations/007_create_sunset_plans.sql` — tabla `sunset_plan` con FK a api_version y replacement_version_id, campos: sunset_date, migration_guide_url, created_at
- [ ] 2.2 Crear servidor Express con configuración base
  - [ ] 2.2.1 `packages/catalog-service/src/index.ts` — Express app en puerto 3002 con middleware compartido
- [ ] 2.3 Implementar Parser OpenAPI
  - [ ] 2.3.1 `packages/catalog-service/src/parser/parser.ts` — Función `parse(content: string, format: 'yaml' | 'json'): ParseResult` que transforma OpenAPI YAML/JSON en modelo interno `InternalApiDefinition` usando `js-yaml` para YAML y `JSON.parse` para JSON
  - [ ] 2.3.2 `packages/catalog-service/src/parser/pretty-printer.ts` — Función `format(model: InternalApiDefinition, format: 'yaml' | 'json'): string` que serializa el modelo interno de vuelta a YAML/JSON
  - [ ] 2.3.3 `packages/catalog-service/src/parser/validator.ts` — Validación básica del esquema OpenAPI 3.x (verificar campos requeridos: openapi, info, paths)
  - [ ] 2.3.4 `POST /v1/internal/parser/parse` — Endpoint que recibe content + format, retorna modelo o lista de errores
  - [ ] 2.3.5 `POST /v1/internal/parser/format` — Endpoint que recibe modelo + format, retorna string formateado
- [ ] 2.4 Implementar endpoints del Catálogo
  - [ ] 2.4.1 `GET /v1/catalog/apis` — Listar APIs filtradas por business_profile del consumidor autenticado y su plan de suscripción. Query params: profile, status, search, category. Incluir etiqueta de deprecación y fecha sunset si aplica
  - [ ] 2.4.2 `GET /v1/catalog/apis/:id` — Detalle de una API con todas sus versiones y estado
  - [ ] 2.4.3 `POST /v1/admin/apis` — Crear nueva definición de API (solo admin)
  - [ ] 2.4.4 `POST /v1/admin/apis/:id/versions` — Publicar nueva versión con spec OpenAPI, validar con parser antes de guardar
- [ ] 2.5 Implementar generación de documentación y snippets
  - [ ] 2.5.1 `GET /v1/catalog/apis/:id/docs` — Retornar modelo parseado de la spec OpenAPI con endpoints agrupados por recurso, esquemas expandidos y ejemplos
  - [ ] 2.5.2 `GET /v1/catalog/apis/:id/snippets/:lang` — Generar snippet de código para un endpoint en JavaScript, Python, Java o cURL a partir de la spec OpenAPI
  - [ ] 2.5.3 `packages/catalog-service/src/snippets/generator.ts` — Módulo con templates de snippets por lenguaje (string interpolation con endpoint, method, headers, body de ejemplo)
- [ ] 2.6 Seed data de APIs demo
  - [ ] 2.6.1 Agregar a `014_seed_data.sql`: 3 API definitions (Cotización Autos, Póliza Salud, Consulta Siniestros), cada una con 1-2 versiones y specs OpenAPI de ejemplo embebidas
- [ ] 2.7 Tests mínimos funcionales
  - [ ] 2.7.1 Test: Parser round-trip — parsear spec YAML, formatear a YAML, re-parsear, verificar equivalencia (Property 1)
  - [ ] 2.7.2 Test: `GET /v1/catalog/apis` retorna solo APIs del perfil del consumidor
  - [ ] 2.7.3 Test: `GET /v1/catalog/apis/:id/snippets/curl` retorna snippet válido

---

## Dev 3 — Sandbox + Gateway Simulator (Reqs 3, 11)

**Directorio**: `packages/sandbox-service/`
**Puerto**: 3003
**Tablas propias**: `sandbox_history`, `sync_log`
**Migraciones**: `008_`, `013_`

- [ ] 3.1 Crear migraciones SQL para tablas propias
  - [ ] 3.1.1 `packages/shared/migrations/008_create_sandbox_history.sql` — tabla `sandbox_history` con campos: id (uuid PK), application_id (FK), api_version_id (FK), method, path, request_headers (jsonb), request_body (jsonb), response_status (int), response_headers (jsonb), response_body (jsonb), response_time_ms, correlation_id, created_at
  - [ ] 3.1.2 `packages/shared/migrations/013_create_sync_logs.sql` — tabla `sync_log` con campos: id, change_type, change_payload (jsonb), status (enum), propagated_at, confirmed_at
- [ ] 3.2 Crear servidor Express con configuración base
  - [ ] 3.2.1 `packages/sandbox-service/src/index.ts` — Express app en puerto 3003 con middleware compartido
- [ ] 3.3 Implementar Motor de Mock
  - [ ] 3.3.1 `packages/sandbox-service/src/mock/mock-engine.ts` — Función `generateMockResponse(openApiSpec: object, path: string, method: string): MockResponse` que genera respuestas simuladas basadas en los esquemas de respuesta definidos en la spec OpenAPI (tipos string→"lorem", number→random, boolean→true/false, array→[1 item])
  - [ ] 3.3.2 `packages/sandbox-service/src/mock/request-validator.ts` — Función `validateRequest(openApiSpec: object, path: string, method: string, params: object): ValidationError[]` que valida parámetros de entrada contra la spec OpenAPI
- [ ] 3.4 Implementar endpoints del Sandbox
  - [ ] 3.4.1 `POST /v1/sandbox/execute` — Recibir apiId, version, method, path, headers, body. Obtener spec OpenAPI de la BD (tabla api_version), validar request contra spec, generar mock response, registrar en sandbox_history, retornar response con statusCode, headers, body, responseTimeMs, correlationId
  - [ ] 3.4.2 `GET /v1/sandbox/history/:appId` — Retornar últimas 50 entradas del historial ordenadas por created_at DESC. Implementar límite FIFO: al insertar nueva entrada, si count > 50, eliminar la más antigua
  - [ ] 3.4.3 `GET /v1/sandbox/apis/:apiId/example` — Retornar ejemplo de petición pre-cargada basada en la spec OpenAPI (primer endpoint, con parámetros de muestra)
- [ ] 3.5 Implementar simulación de traducción SOAP
  - [ ] 3.5.1 `packages/sandbox-service/src/gateway/soap-translator.ts` — Función `jsonToSoapXml(json: object, operation: string): string` que convierte un payload JSON a un envelope SOAP/XML básico
  - [ ] 3.5.2 Función `soapXmlToJson(xml: string): object` que parsea un envelope SOAP/XML y extrae el body como JSON
  - [ ] 3.5.3 `POST /v1/gateway/proxy/:apiId/:version/*` — Endpoint que simula el gateway: recibe REST/JSON, traduce a SOAP si la API está marcada como legacy, ejecuta mock, traduce respuesta de vuelta a JSON
- [ ] 3.6 Tests mínimos funcionales
  - [ ] 3.6.1 Test: `POST /v1/sandbox/execute` con petición válida retorna mock response con estructura correcta
  - [ ] 3.6.2 Test: `GET /v1/sandbox/history/:appId` retorna máximo 50 entradas
  - [ ] 3.6.3 Test: Traducción JSON→SOAP→JSON preserva datos (round-trip básico)

---

## Dev 4 — Analytics + Auditoría + Notificaciones (Reqs 4, 6, 8)

**Directorio**: `packages/analytics-service/`
**Puerto**: 3004
**Tablas propias**: `audit_log`, `usage_metric`, `notification`, `notification_preference`
**Migraciones**: `009_` a `011_`

- [ ] 4.1 Crear migraciones SQL para tablas propias
  - [ ] 4.1.1 `packages/shared/migrations/009_create_audit_logs.sql` — tabla `audit_log` con campos: id (uuid PK), correlation_id (uuid), consumer_id (FK), application_id (FK), api_version_id (FK nullable), endpoint, method, status_code, ip_address (inet), response_time_ms, created_at. Agregar restricción: tabla sin UPDATE ni DELETE (inmutabilidad vía REVOKE)
  - [ ] 4.1.2 `packages/shared/migrations/010_create_usage_metrics.sql` — tabla `usage_metric` con campos: id, application_id (FK), api_version_id (FK), metric_date (date), total_requests, success_count, error_count, avg_latency_ms, quota_used, updated_at. Índice único en (application_id, api_version_id, metric_date)
  - [ ] 4.1.3 `packages/shared/migrations/011_create_notifications.sql` — tablas `notification` (id, consumer_id FK, type enum, title, message, channel enum, priority enum, read boolean, metadata jsonb, created_at, read_at) y `notification_preference` (id, consumer_id FK, event_type enum, email_enabled, portal_enabled)
- [ ] 4.2 Crear servidor Express con configuración base
  - [ ] 4.2.1 `packages/analytics-service/src/index.ts` — Express app en puerto 3004 con middleware compartido
- [ ] 4.3 Implementar servicio de Auditoría
  - [ ] 4.3.1 `POST /v1/audit/log` — Endpoint interno para registrar audit log. Recibir correlationId, consumerId, appId, endpoint, method, statusCode, ipAddress, responseTimeMs. Insertar en tabla audit_log. Actualizar usage_metric del día (upsert: incrementar total_requests, success/error count, recalcular avg_latency)
  - [ ] 4.3.2 `GET /v1/admin/audit/reports` — Listar registros de auditoría con paginación y filtros: consumerId, apiId, from/to (rango fechas), statusCode. Solo accesible por admin
  - [ ] 4.3.3 `POST /v1/admin/audit/export` — Generar archivo CSV o JSON con los registros filtrados. Para ≤100K registros: generar sincrónicamente y retornar downloadUrl. Retornar 200 con URL de descarga
- [ ] 4.4 Implementar servicio de Analytics
  - [ ] 4.4.1 `GET /v1/analytics/dashboard/:appId` — Retornar métricas agregadas: totalRequests, successRate, errorRate, avgLatencyMs. Query params: from, to, apiId, statusCode. Calcular desde usage_metric
  - [ ] 4.4.2 `GET /v1/analytics/quota/:appId` — Retornar quotaUsedPercent (peticiones del período actual / límite del plan × 100), quotaLimit, quotaUsed. Obtener límite del plan desde subscription_plan
- [ ] 4.5 Implementar servicio de Notificaciones
  - [ ] 4.5.1 `GET /v1/notifications` — Listar notificaciones del consumidor autenticado, ordenadas por created_at DESC, con filtro por read/unread
  - [ ] 4.5.2 `PUT /v1/notifications/:id/read` — Marcar notificación como leída (set read=true, read_at=now)
  - [ ] 4.5.3 `PUT /v1/notifications/preferences` — Actualizar preferencias de notificación del consumidor (email_enabled, portal_enabled por tipo de evento)
  - [ ] 4.5.4 `POST /v1/internal/notifications/send` — Endpoint interno para crear notificación. Recibir consumerId, type, title, message, priority. Insertar en tabla notification con channel='portal'
- [ ] 4.6 Seed data de métricas y notificaciones demo
  - [ ] 4.6.1 Agregar a `014_seed_data.sql`: 30 registros de audit_log, 7 días de usage_metrics para las apps demo, 5 notificaciones de ejemplo (nueva versión, mantenimiento, cuota al 80%)
- [ ] 4.7 Tests mínimos funcionales
  - [ ] 4.7.1 Test: `POST /v1/audit/log` crea registro inmutable y actualiza usage_metric
  - [ ] 4.7.2 Test: `GET /v1/analytics/dashboard/:appId` retorna métricas correctas con filtros
  - [ ] 4.7.3 Test: `GET /v1/notifications` retorna solo notificaciones del consumidor autenticado

---

## Dev 5 — Frontend React (UI para Reqs 1-9)

**Directorio**: `packages/frontend/`
**Puerto**: 5173 (Vite dev server)
**Dependencias backend**: Consume APIs de los 4 servicios backend vía REST

- [x] 5.1 Inicializar proyecto React con Vite + TypeScript + Tailwind
  - [x] 5.1.1 `npm create vite@latest` con template react-ts en `packages/frontend/`
  - [x] 5.1.2 Instalar dependencias: `tailwindcss`, `@tanstack/react-query`, `react-router-dom`, `axios`, `lucide-react`, `sonner`, `react-hook-form`, `zod`, `@hookform/resolvers`
  - [x] 5.1.3 Configurar Tailwind CSS, React Query provider, React Router con rutas base
  - [x] 5.1.4 Crear `packages/frontend/src/lib/api.ts` — Cliente Axios con baseURL configurable por variable de entorno, interceptor para adjuntar JWT en header Authorization, interceptor de error para manejar 401 (redirect a login)
- [x] 5.2 Implementar layout y navegación
  - [x] 5.2.1 `src/components/layout/AppLayout.tsx` — Layout principal con sidebar de navegación (links: Catálogo, Sandbox, Analytics, Notificaciones, Admin) y header con nombre del usuario y botón logout
  - [x] 5.2.2 `src/components/layout/AuthLayout.tsx` — Layout para páginas de auth (registro, login) sin sidebar
  - [x] 5.2.3 Configurar rutas en `src/App.tsx`: `/login`, `/register`, `/catalog`, `/sandbox`, `/analytics`, `/notifications`, `/admin/consumers`, `/admin/apis`
- [x] 5.3 Implementar páginas de autenticación (Req 1)
  - [x] 5.3.1 `src/pages/Register.tsx` — Formulario de registro con campos: email, password, companyName, businessProfile (select), contactName. Validación con Zod + react-hook-form. Al submit: POST a `/v1/auth/register`, mostrar mensaje de éxito con toast (sonner)
  - [x] 5.3.2 `src/pages/Login.tsx` — Formulario de login con email y password. Al submit: POST a `/v1/auth/login`, guardar JWT en memoria (React state/context), redirect a `/catalog`
  - [x] 5.3.3 `src/context/AuthContext.tsx` — Context provider para estado de autenticación: user, accessToken, login(), logout(), isAuthenticated
- [x] 5.4 Implementar página de Catálogo de APIs (Req 2)
  - [x] 5.4.1 `src/pages/Catalog.tsx` — Lista de APIs con cards. Cada card muestra: nombre, descripción, versión, estado (badge de color), categoría. Filtros: búsqueda por texto, categoría, estado. Badge de "Deprecada" con fecha sunset si aplica. Click en card navega a detalle
  - [x] 5.4.2 `src/pages/ApiDetail.tsx` — Detalle de API con tabs: Documentación (endpoints agrupados por recurso), Snippets (selector de lenguaje con código copiable), Versiones (lista de versiones con estado)
- [x] 5.5 Implementar página de Sandbox (Req 3)
  - [x] 5.5.1 `src/pages/Sandbox.tsx` — Interfaz tipo Postman: selector de API y versión, selector de método HTTP, campo de path, editor de headers (key-value), editor de body (textarea JSON). Botón "Ejecutar". Panel de respuesta: status code (badge de color), headers, body formateado, tiempo de respuesta. Historial de últimas peticiones en sidebar colapsable
- [x] 5.6 Implementar página de Analytics (Req 4)
  - [x] 5.6.1 `src/pages/Analytics.tsx` — Dashboard con: 4 cards de métricas (total peticiones, tasa éxito %, tasa error %, latencia promedio ms). Barra de progreso de cuota (% usado con colores: verde <60%, amarillo 60-80%, rojo >80%). Filtros: rango de fechas, API específica. Tabla de peticiones recientes
- [x] 5.7 Implementar páginas de Administración (Reqs 7, 9)
  - [x] 5.7.1 `src/pages/admin/ConsumerManagement.tsx` — Tabla de consumidores con columnas: nombre, email, estado (badge), # apps, fecha registro. Acciones: aprobar, suspender, revocar (con modal de confirmación y campo de motivo). Búsqueda por nombre/email/estado
  - [x] 5.7.2 `src/pages/admin/ApiManagement.tsx` — Lista de APIs con versiones. Acciones: crear API, publicar versión (formulario con textarea para spec OpenAPI), crear plan sunset (date picker con validación ≥90 días)
- [x] 5.8 Implementar página de Notificaciones (Req 6)
  - [x] 5.8.1 `src/pages/Notifications.tsx` — Lista de notificaciones con badge de no leídas en sidebar. Cada notificación muestra: tipo (icono), título, mensaje, fecha, prioridad. Click marca como leída. Filtro: todas/no leídas
- [x] 5.9 Tests mínimos funcionales
  - [x] 5.9.1 Test: Página de Login renderiza formulario y maneja submit
  - [x] 5.9.2 Test: Página de Catálogo renderiza lista de APIs con filtros
  - [x] 5.9.3 Test: Página de Sandbox renderiza interfaz de ejecución y muestra respuesta

---

## Fase Final — Integración (Últimos 30 min — Todos juntos)

- [ ] 6.1 Levantar todos los servicios con Docker Compose y verificar conectividad
- [ ] 6.2 Ejecutar migraciones completas y seed data
- [ ] 6.3 Verificar flujo completo: registro → login → ver catálogo → ejecutar sandbox → ver analytics → admin gestiona aliado
- [ ] 6.4 Corregir errores de integración entre módulos (CORS, rutas, contratos)
- [ ] 6.5 Ejecutar suite de tests de todos los módulos: `npm test --workspaces`
