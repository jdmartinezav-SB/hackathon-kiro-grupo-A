# Tasks — Dev 1: Backend Core + Auth

> **Puerto**: 3000 | **Directorio**: `packages/backend-core/`
> **Requerimientos**: 1 (Onboarding), 7 (Gestión Aliados), 10 (Seguridad OAuth2/JWT)
> **Tablas propias**: consumer, application, credential, subscription_plan, subscription_api, admin_action_log
> **Migraciones asignadas**: prefijos `001_` a `004_`, `012_`
> **NO tocar**: Ningún archivo fuera de `packages/backend-core/` y tus migraciones asignadas

---

## Hora 1 (0:00 - 1:00) — Base + Auth

- [x] Crear migraciones `001_create_consumers.sql`, `002_create_applications.sql`, `003_create_credentials.sql`, `004_create_subscription_plans.sql`
- [x] Crear `packages/backend-core/src/index.ts` — Express en puerto 3000 con middleware compartido
- [x] Implementar `POST /v1/auth/register` — Validar con Zod, hashear con bcrypt, insertar consumer
- [x] Implementar `POST /v1/auth/login` — Validar credenciales, generar JWT con jsonwebtoken
- [x] Implementar `POST /v1/auth/verify-email` — Marcar email_verified=true
- [x] Implementar middleware `authJwt` en shared (verificar firma, expiración, adjuntar a req.user)
- [x] Implementar middleware `requireRole('admin')`

## Hora 2 (1:00 - 2:00) — CRUD + Admin

- [x] Implementar `GET /v1/consumers/:id` — Solo datos propios (protección BOLA)
- [x] Implementar `POST /v1/consumers/:id/apps` — Crear app + generar client_id/client_secret
- [x] Implementar `GET /v1/admin/consumers` — Listar con paginación y filtros
- [x] Implementar `PUT /v1/admin/consumers/:id/status` — Cambiar status + registrar en admin_action_log
- [x] Crear migración `012_create_admin_action_logs.sql`

## Hora 2:30 (2:00 - 2:30) — Seed + Tests

- [x] Crear seed data en `014_seed_data.sql`: 2 consumidores, 3 apps, 1 plan, 1 admin
- [x] Test: registro con datos válidos retorna 201
- [x] Test: login retorna JWT válido
- [x] Test: cambio de status registra en admin_action_log

## Hora 3 (2:30 - 3:00) — Integración

- [x] Verificar que los otros servicios pueden usar el middleware authJwt
- [x] Verificar flujo completo: register → login → crear app → ver credenciales
- [x] Corregir errores de integración
