# Tasks — Dev 5: Frontend React

> **Puerto**: 5173 | **Directorio**: `packages/frontend/`
> **Requerimientos**: UI para Reqs 1-9 (todas las páginas del portal)
> **Stack**: React 18 + Vite + TypeScript + Tailwind CSS + React Query + React Router
> **NO tocar**: Ningún archivo fuera de `packages/frontend/`
> **Consume**: APIs de Dev 1 (3000), Dev 2 (3002), Dev 3 (3003), Dev 4 (3004)
> **Tip**: Mientras los backends no estén listos, usar datos mock hardcodeados. Reemplazar con llamadas reales en la integración.

---

## Hora 1 (0:00 - 1:00) — Setup + Auth + Layout

- [ ] Inicializar Vite + React + TypeScript en `packages/frontend/`
- [ ] Instalar: tailwindcss, @tanstack/react-query, react-router-dom, axios, lucide-react, sonner, react-hook-form, zod, @hookform/resolvers
- [ ] Configurar Tailwind, React Query provider, React Router
- [ ] Crear `src/lib/api.ts` — Cliente Axios con baseURL configurable, interceptor JWT, interceptor 401→redirect login
- [ ] Crear `src/context/AuthContext.tsx` — Provider con user, accessToken, login(), logout()
- [ ] Crear `AppLayout.tsx` — Sidebar con links (Catálogo, Sandbox, Analytics, Notificaciones, Admin) + header con usuario
- [ ] Crear `AuthLayout.tsx` — Layout limpio para login/registro
- [ ] Crear `src/pages/Login.tsx` — Formulario email + password, POST a /v1/auth/login, guardar JWT, redirect
- [ ] Crear `src/pages/Register.tsx` — Formulario completo con validación Zod (email, password, companyName, businessProfile, contactName)

## Hora 2 (1:00 - 2:00) — Páginas principales

- [ ] Crear `src/pages/Catalog.tsx` — Cards de APIs con nombre, descripción, versión, estado (badge color), categoría. Filtros: búsqueda, categoría, estado. Badge "Deprecada" con fecha sunset
- [ ] Crear `src/pages/ApiDetail.tsx` — Tabs: Documentación (endpoints agrupados), Snippets (selector lenguaje + código copiable), Versiones
- [ ] Crear `src/pages/Sandbox.tsx` — Interfaz tipo Postman: selector API/versión, método, path, headers (key-value), body (textarea JSON). Botón ejecutar. Panel respuesta: status badge, headers, body formateado, tiempo. Historial en sidebar
- [ ] Crear `src/pages/Analytics.tsx` — 4 cards métricas (total, éxito %, error %, latencia). Barra progreso cuota (verde/amarillo/rojo). Filtros fecha + API

## Hora 2:30 (2:00 - 2:30) — Admin + Notificaciones + Tests

- [ ] Crear `src/pages/admin/ConsumerManagement.tsx` — Tabla consumidores con acciones (aprobar/suspender/revocar + modal confirmación). Búsqueda
- [ ] Crear `src/pages/admin/ApiManagement.tsx` — Lista APIs con versiones. Crear API, publicar versión (textarea spec), crear sunset plan
- [ ] Crear `src/pages/Notifications.tsx` — Lista con badge no leídas, click marca leída, filtro todas/no leídas
- [ ] Test: Login renderiza formulario y maneja submit
- [ ] Test: Catálogo renderiza lista de APIs
- [ ] Test: Sandbox renderiza interfaz y muestra respuesta

## Hora 3 (2:30 - 3:00) — Integración

- [ ] Reemplazar datos mock con llamadas reales a los 4 backends
- [ ] Configurar proxy en vite.config.ts para los 4 puertos backend
- [ ] Verificar flujo completo: registro → login → catálogo → sandbox → analytics → admin
- [ ] Corregir errores de integración (CORS, contratos, rutas)
