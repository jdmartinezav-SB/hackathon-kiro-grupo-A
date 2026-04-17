# Tasks — Dev 2: Catálogo + Docs + Parser OpenAPI

> **Puerto**: 3002 | **Directorio**: `packages/catalog-service/`
> **Requerimientos**: 2 (Catálogo), 5 (Docs/SDKs), 16 (Parser OpenAPI), 14 (IA/MCP)
> **Tablas propias**: api_definition, api_version, sunset_plan
> **Migraciones asignadas**: prefijos `005_` a `007_`
> **NO tocar**: Ningún archivo fuera de `packages/catalog-service/` y tus migraciones asignadas

---

## Hora 1 (0:00 - 1:00) — Parser OpenAPI + Migraciones

- [x] Crear migraciones `005_create_api_definitions.sql`, `006_create_api_versions.sql`, `007_create_sunset_plans.sql`
- [x] Crear `packages/catalog-service/src/index.ts` — Express en puerto 3002
- [x] Implementar `parser.ts` — Función `parse(content, format)` que transforma YAML/JSON en modelo interno usando `js-yaml`
- [x] Implementar `pretty-printer.ts` — Función `format(model, format)` que serializa modelo a YAML/JSON
- [x] Implementar `validator.ts` — Validación básica OpenAPI 3.x (campos requeridos: openapi, info, paths)
- [x] Implementar `POST /v1/internal/parser/parse` y `POST /v1/internal/parser/format`

## Hora 2 (1:00 - 2:00) — Catálogo + Docs

- [x] Implementar `GET /v1/catalog/apis` — Filtrar por business_profile del consumer y plan de suscripción. Incluir badge deprecación + fecha sunset
- [x] Implementar `GET /v1/catalog/apis/:id` — Detalle con versiones
- [x] Implementar `POST /v1/admin/apis` — Crear API (solo admin)
- [x] Implementar `POST /v1/admin/apis/:id/versions` — Publicar versión, validar spec con parser
- [x] Implementar `GET /v1/catalog/apis/:id/docs` — Modelo parseado con endpoints agrupados
- [x] Implementar `GET /v1/catalog/apis/:id/snippets/:lang` — Snippets en JS, Python, Java, cURL
- [x] Crear `generator.ts` con templates de snippets por lenguaje

## Hora 2:30 (2:00 - 2:30) — Seed + Tests

- [x] Agregar seed data: 3 APIs demo con specs OpenAPI embebidas (Cotización Autos, Póliza Salud, Consulta Siniestros)
- [x] Test: Parser round-trip (parse YAML → format YAML → re-parse = equivalente) — **PRIORIDAD MÁXIMA**
- [x] Test: `GET /v1/catalog/apis` retorna solo APIs del perfil del consumer
- [x] Test: `GET /v1/catalog/apis/:id/snippets/curl` retorna snippet válido

## Hora 3 (2:30 - 3:00) — Integración

- [x] Verificar que el sandbox (Dev 3) puede leer api_version para obtener specs
- [x] Verificar que el frontend (Dev 5) puede consumir el catálogo
- [x] Corregir errores de integración
