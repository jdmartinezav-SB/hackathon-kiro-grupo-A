# 🏦 Conecta 2.0 — Portal de APIs

Portal interno de gestión de APIs para **Seguros Bolívar**. Permite a los equipos descubrir, probar y consumir APIs corporativas desde un único punto de acceso con catálogo, sandbox interactivo, analíticas de uso y administración de consumidores.

---

## 📐 Arquitectura

Monorepo con **npm workspaces** organizado en microservicios backend (Node.js + Express) y un frontend React:

```
conecta-2-portal/
├── packages/
│   ├── shared/              # Tipos, middleware, pool de BD y migraciones SQL
│   ├── backend-core/        # Auth (JWT), gestión de consumidores, proxy a servicios
│   ├── catalog-service/     # Catálogo de APIs, documentación y snippets
│   ├── sandbox-service/     # Motor de sandbox y mocks para pruebas de APIs
│   └── analytics-service/   # Métricas de uso, auditoría y notificaciones
├── hackathon-kiro-grupo-A/
│   └── packages/frontend/   # SPA React (Vite + Tailwind CSS)
├── docker-compose.yml       # PostgreSQL 15 + Redis 7
└── docs/                    # Documentación del reto y presentación
```

### Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 18, Vite 5, TS 5.7 |
| UI | Tailwind CSS 4 + Seguros Bolívar UI (`@seguros-bolivar/ui-bundle`) | — |
| Routing | react-router-dom | 6.x |
| State / Data | React Query (`@tanstack/react-query`) + React Hook Form + Zod | 5.x / 7.x / 3.x |
| Backend | Node.js + Express + TypeScript | Node 20, Express 4.x |
| Base de datos | PostgreSQL | 15 (Alpine) |
| Caché | Redis | 7 (Alpine) |
| Autenticación | JWT (`jsonwebtoken`) + bcrypt | 9.x / 5.x |
| Testing frontend | Vitest + React Testing Library | 4.x / 16.x |
| Testing backend | Jest + Supertest | 30.x / 7.x |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 20.x (LTS)
- **npm** 10.x+
- **Docker** y **Docker Compose** (para PostgreSQL y Redis)
- Token de **JFrog Artifactory** configurado (ver sección de seguridad)

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd conecta-2-portal
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores si es necesario:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Valor por defecto | Descripción |
|----------|------------------|-------------|
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `conecta2` | Nombre de la base de datos |
| `DB_USER` | `postgres` | Usuario de BD |
| `DB_PASSWORD` | `postgres` | Contraseña de BD |
| `JWT_SECRET` | `conecta2-dev-secret` | Secreto para firmar tokens JWT |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido para CORS |
| `BACKEND_CORE_PORT` | `3000` | Puerto del servicio principal |
| `CATALOG_SERVICE_PORT` | `3002` | Puerto del catálogo |
| `SANDBOX_SERVICE_PORT` | `3003` | Puerto del sandbox |
| `ANALYTICS_SERVICE_PORT` | `3004` | Puerto de analíticas |
| `VITE_API_URL` | `http://localhost:3000` | URL del backend para el frontend |

### 3. Levantar infraestructura (PostgreSQL + Redis)

```bash
docker compose up -d
```

Esto crea la base de datos `conecta2` y ejecuta las migraciones automáticamente desde `packages/shared/migrations/`.

### 4. Iniciar los servicios backend

Cada servicio se ejecuta de forma independiente. Abre una terminal por servicio:

```bash
# Terminal 1 — Backend Core (auth + proxy)
npm run dev -w packages/backend-core

# Terminal 2 — Catalog Service
npm run dev -w packages/catalog-service

# Terminal 3 — Sandbox Service
npm run dev -w packages/sandbox-service

# Terminal 4 — Analytics Service
npm run dev -w packages/analytics-service
```

### 5. Iniciar el frontend

```bash
cd hackathon-kiro-grupo-A/packages/frontend
npm install
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**.

---

## � Servicios

### Backend Core (`packages/backend-core`) — Puerto 3000
Servicio principal que maneja autenticación JWT, gestión de consumidores y actúa como proxy hacia los demás microservicios.

### Catalog Service (`packages/catalog-service`) — Puerto 3002
Gestión del catálogo de APIs: definiciones, versiones, documentación (OpenAPI/YAML) y snippets de código.

### Sandbox Service (`packages/sandbox-service`) — Puerto 3003
Motor de sandbox para pruebas interactivas de APIs con generación de mocks y registro de historial.

### Analytics Service (`packages/analytics-service`) — Puerto 3004
Métricas de uso, logs de auditoría y sistema de notificaciones.

### Shared (`packages/shared`)
Módulo compartido con tipos TypeScript, middleware común (auth, CORS, Helmet), pool de conexión a PostgreSQL y migraciones SQL.

---

## 🖥️ Frontend — Páginas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | Login | Inicio de sesión con JWT |
| `/register` | Register | Registro de nuevos consumidores |
| `/catalog` | Catalog | Catálogo de APIs disponibles con búsqueda y filtros |
| `/catalog/:id` | ApiDetail | Detalle de una API: documentación, versiones, snippets |
| `/sandbox` | Sandbox | Consola interactiva para probar APIs |
| `/analytics` | Analytics | Dashboard de métricas y uso de APIs |
| `/notifications` | Notifications | Centro de notificaciones |
| `/admin/consumers` | ConsumerManagement | Gestión de consumidores (admin) |
| `/admin/apis` | ApiManagement | Gestión de APIs (admin) |

---

## 🧪 Testing

```bash
# Tests del frontend (Vitest)
cd hackathon-kiro-grupo-A/packages/frontend
npm test

# Tests de un servicio backend (Jest)
npm test -w packages/backend-core
npm test -w packages/catalog-service
npm test -w packages/sandbox-service
npm test -w packages/analytics-service
```

---

## 🗄️ Base de Datos

PostgreSQL 15 con 15 migraciones que crean las tablas principales:

- `consumers` — Consumidores registrados
- `applications` — Aplicaciones de los consumidores
- `credentials` — Credenciales de acceso (API keys)
- `subscription_plans` — Planes de suscripción
- `api_definitions` — Definiciones de APIs
- `api_versions` — Versiones de cada API
- `sunset_plans` — Planes de deprecación
- `sandbox_history` — Historial de pruebas en sandbox
- `audit_logs` — Logs de auditoría
- `usage_metrics` — Métricas de uso
- `notifications` — Notificaciones del sistema
- `admin_action_logs` — Acciones administrativas
- `sync_logs` — Logs de sincronización

Las migraciones incluyen datos semilla para desarrollo (`014_seed_data.sql`, `015_seed_analytics_data.sql`).

---

## 🔐 Requisitos de Seguridad

Este proyecto utiliza el registro privado **JFrog Artifactory** para el paquete `@seguros-bolivar/ui-bundle`. Para instalar dependencias, **debes** configurar tu token personal.

### Configuración en Mac (Zsh)

Añade la siguiente línea a tu archivo `~/.zshrc`:

```bash
export JFROG_AUTH_TOKEN="TU_TOKEN_PERSONAL_AQUÍ"
```

### Configuración en Windows (PowerShell)

```powershell
[System.Environment]::SetEnvironmentVariable("JFROG_AUTH_TOKEN", "TU_TOKEN_PERSONAL_AQUÍ", "User")
```

Reinicia la terminal después de configurar la variable.

---

## 📁 Documentación adicional

La carpeta `docs/` contiene los documentos del reto Conecta 2.0:

- Caso de negocio
- Criterios de evaluación
- Investigación del portal de APIs
- Transcripción de la sesión de contexto
- Presentación del hackathon
