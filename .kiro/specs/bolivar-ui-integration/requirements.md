# Documento de Requerimientos — Integración Bolívar UI Design System

## Introducción

Este documento define los requerimientos para integrar la librería Bolívar UI Design System en el frontend React existente del proyecto Conecta 2.0 (`packages/frontend/`). El objetivo es reemplazar los componentes HTML nativos con estilos Tailwind genéricos (esquema indigo) por los Web Components del Design System de Seguros Bolívar, aplicando la marca corporativa y cumpliendo con las reglas CSS del steering (`CSS.md`). La integración se realiza vía CDN y debe mantener toda la funcionalidad existente intacta.

## Glosario

- **Frontend**: Aplicación React 18 + Vite + TypeScript ubicada en `packages/frontend/`
- **Bolívar_UI**: Librería de Web Components del Design System de Seguros Bolívar, distribuida vía CDN
- **Web_Component**: Elemento HTML personalizado con prefijo `sb-ui-` (ej: `<sb-ui-button>`, `<sb-ui-input>`) proporcionado por Bolívar_UI
- **CDN_Loader**: Script y estilos cargados desde la CDN de Bolívar_UI en el archivo `index.html`
- **Marca_Seguros_Bolívar**: Tema visual corporativo activado mediante el atributo `data-brand="seguros-bolivar"` en el elemento raíz del DOM
- **Tailwind_CSS**: Framework CSS de utilidades actualmente usado en el Frontend (versión 4.x con `@tailwindcss/vite`)
- **React_Query**: Librería `@tanstack/react-query` usada para gestión de estado del servidor y caché
- **Auth_Context**: Context provider de React que gestiona autenticación (user, accessToken, login, logout)
- **Página_Auth**: Páginas de Login y Register que usan el layout `AuthLayout`
- **Página_App**: Páginas protegidas que usan el layout `AppLayout` con sidebar y header
- **CSS_Rules**: Reglas obligatorias del Design System definidas en el steering `CSS.md` (prefijo `sb-ui-`, logical properties, `@layer`, `clamp()`, CSS nesting, accesibilidad)

## Requerimientos

### Requerimiento 1: Carga de Bolívar UI vía CDN

**User Story:** Como desarrollador frontend, quiero cargar la librería Bolívar UI desde el CDN corporativo, para que los Web Components estén disponibles en toda la aplicación sin instalar paquetes npm.

#### Criterios de Aceptación

1. WHEN el archivo `index.html` es cargado por el navegador, THE CDN_Loader SHALL incluir las etiquetas `<link>` y `<script>` necesarias para cargar los estilos y scripts de Bolívar_UI desde la URL CDN correspondiente a la Marca_Seguros_Bolívar
2. WHEN Bolívar_UI es cargado, THE Frontend SHALL registrar los Web_Component en el Custom Elements Registry del navegador, permitiendo su uso como elementos HTML válidos
3. THE Frontend SHALL declarar los tipos TypeScript necesarios para que los Web_Component de Bolívar_UI sean reconocidos por el compilador sin errores de tipo
4. IF la CDN no responde o el script falla al cargar, THEN THE Frontend SHALL continuar renderizando la aplicación con un fallback visual funcional sin bloquear la interfaz

### Requerimiento 2: Aplicación del Tema Corporativo Seguros Bolívar

**User Story:** Como usuario del portal, quiero ver la interfaz con los colores y estilos corporativos de Seguros Bolívar, para que la experiencia visual sea consistente con la marca.

#### Criterios de Aceptación

1. THE Frontend SHALL aplicar el atributo `data-brand="seguros-bolivar"` en el elemento `<html>` o `<body>` del documento para activar el tema corporativo
2. WHEN el tema corporativo está activo, THE Frontend SHALL mostrar los colores primarios de Seguros Bolívar (verde corporativo `#009056`) en lugar del esquema indigo genérico actual
3. THE Frontend SHALL reemplazar el logo y branding genérico "C2" con fondo indigo por una versión que use los colores corporativos de Seguros Bolívar en el sidebar y en el layout de autenticación
4. WHEN un Web_Component de Bolívar_UI es renderizado, THE Web_Component SHALL heredar automáticamente los tokens de color, tipografía y espaciado definidos por la Marca_Seguros_Bolívar

### Requerimiento 3: Migración de Botones a sb-ui-button

**User Story:** Como usuario del portal, quiero interactuar con botones que sigan el Design System corporativo, para tener una experiencia visual consistente y accesible.

#### Criterios de Aceptación

1. WHEN una página contiene un botón de acción primaria (submit, ejecutar, crear), THE Frontend SHALL renderizar un `<sb-ui-button>` con variante `primary` y estilo `fill` en lugar del elemento `<button>` con clases Tailwind `bg-indigo-600`
2. WHEN una página contiene un botón de acción secundaria (cancelar, cerrar), THE Frontend SHALL renderizar un `<sb-ui-button>` con variante `secondary` y estilo `stroke` en lugar del elemento `<button>` con clases Tailwind de borde gris
3. WHEN un botón está en estado `disabled`, THE Web_Component `sb-ui-button` SHALL mostrar el estilo deshabilitado definido por la Marca_Seguros_Bolívar y bloquear la interacción del usuario
4. WHEN un botón está en estado de carga (`loading`), THE Web_Component `sb-ui-button` SHALL mostrar un indicador de carga (spinner) y bloquear clics adicionales
5. THE Frontend SHALL migrar los botones en las siguientes páginas: Login, Register, Catalog, ApiDetail, Sandbox, Analytics, Notifications, ConsumerManagement y ApiManagement

### Requerimiento 4: Migración de Campos de Formulario a sb-ui-input y sb-ui-select

**User Story:** Como usuario del portal, quiero que los campos de formulario sigan el Design System corporativo, para tener una experiencia de entrada de datos consistente y accesible.

#### Criterios de Aceptación

1. WHEN una página contiene un campo de texto (`<input type="text">`, `<input type="email">`, `<input type="password">`), THE Frontend SHALL renderizar un `<sb-ui-input>` con el tipo correspondiente en lugar del elemento `<input>` con clases Tailwind
2. WHEN una página contiene un campo de selección (`<select>`), THE Frontend SHALL renderizar un `<sb-ui-select>` con las opciones correspondientes en lugar del elemento `<select>` con clases Tailwind
3. WHEN una página contiene un campo de texto multilínea (`<textarea>`), THE Frontend SHALL renderizar un `<sb-ui-input>` con variante textarea o el Web_Component equivalente de Bolívar_UI
4. WHEN un campo de formulario tiene un error de validación, THE Web_Component SHALL mostrar el estado de error con el estilo definido por la Marca_Seguros_Bolívar (borde rojo, mensaje de error visible)
5. THE Frontend SHALL mantener la integración con React Hook Form y Zod para validación, conectando los Web_Component mediante `ref` forwarding o event listeners nativos
6. THE Frontend SHALL migrar los formularios en las siguientes páginas: Login (email, password), Register (email, password, confirmPassword, companyName, businessProfile, contactName), Sandbox (headers key-value, body textarea), ConsumerManagement (motivo textarea), ApiManagement (nombre, descripción, categoría, spec textarea, fecha sunset)

### Requerimiento 5: Migración de Tablas a sb-ui-table

**User Story:** Como usuario administrador, quiero que las tablas de datos sigan el Design System corporativo, para tener una visualización de datos consistente y legible.

#### Criterios de Aceptación

1. WHEN una página muestra datos tabulares, THE Frontend SHALL renderizar un `<sb-ui-table>` con las columnas y filas correspondientes en lugar de la tabla HTML nativa con clases Tailwind
2. THE Frontend SHALL migrar las tablas en las siguientes páginas: Analytics (tabla de peticiones recientes) y ConsumerManagement (tabla de consumidores)
3. WHEN la tabla contiene badges de estado (activo, suspendido, revocado, códigos HTTP), THE Frontend SHALL usar los estilos de badge proporcionados por Bolívar_UI o mantener badges consistentes con los tokens de color de la Marca_Seguros_Bolívar

### Requerimiento 6: Migración de Tabs a sb-ui-tabs

**User Story:** Como usuario del portal, quiero que las pestañas de navegación sigan el Design System corporativo, para tener una navegación por secciones consistente y accesible.

#### Criterios de Aceptación

1. WHEN una página contiene navegación por pestañas, THE Frontend SHALL renderizar un `<sb-ui-tabs>` con los paneles correspondientes en lugar de los botones con clases Tailwind `border-b-2 border-indigo-600`
2. THE Frontend SHALL migrar las pestañas en las siguientes páginas: ApiDetail (Documentación, Snippets, Versiones) y Notifications (Todas, No leídas)
3. WHEN el usuario selecciona una pestaña, THE Web_Component `sb-ui-tabs` SHALL mostrar el contenido del panel correspondiente y aplicar el estilo activo definido por la Marca_Seguros_Bolívar

### Requerimiento 7: Migración de Modales a sb-ui-modal

**User Story:** Como usuario administrador, quiero que los diálogos de confirmación sigan el Design System corporativo, para tener una experiencia de interacción modal consistente y accesible.

#### Criterios de Aceptación

1. WHEN una acción requiere confirmación del usuario (aprobar, suspender, revocar consumidor), THE Frontend SHALL renderizar un `<sb-ui-modal>` en lugar del div con overlay y clases Tailwind `fixed inset-0 z-50`
2. THE Frontend SHALL migrar los modales en las siguientes páginas: ConsumerManagement (modal de confirmación de acción) y ApiManagement (modales de nueva API, publicar versión, plan sunset)
3. WHEN el modal está abierto, THE Web_Component `sb-ui-modal` SHALL bloquear la interacción con el contenido detrás del modal y gestionar el foco de teclado (focus trap) según las pautas WCAG
4. WHEN el usuario presiona la tecla Escape o hace clic fuera del modal, THE Web_Component `sb-ui-modal` SHALL cerrar el diálogo

### Requerimiento 8: Migración de Alertas y Notificaciones Visuales a sb-ui-alert

**User Story:** Como usuario del portal, quiero que las alertas y mensajes informativos sigan el Design System corporativo, para identificar rápidamente el tipo y prioridad de cada mensaje.

#### Criterios de Aceptación

1. WHEN la página de Notifications muestra una notificación con prioridad urgente, THE Frontend SHALL renderizar un `<sb-ui-alert>` con variante `error` para destacar visualmente la urgencia
2. WHEN una API está marcada como deprecada en el Catálogo, THE Frontend SHALL renderizar un `<sb-ui-alert>` con variante `warning` mostrando la fecha de sunset
3. WHEN el Sandbox muestra un error de respuesta (status >= 400), THE Frontend SHALL usar estilos de alerta consistentes con los tokens de feedback de la Marca_Seguros_Bolívar

### Requerimiento 9: Migración del Spinner de Carga a sb-ui-spinner

**User Story:** Como usuario del portal, quiero ver indicadores de carga consistentes con el Design System corporativo, para saber que la aplicación está procesando una acción.

#### Criterios de Aceptación

1. WHEN una operación asíncrona está en progreso (login, registro, ejecución sandbox, carga de datos), THE Frontend SHALL renderizar un `<sb-ui-spinner>` con el tamaño apropiado en lugar de texto "Cargando…" o animaciones CSS personalizadas
2. WHEN un botón está en estado de carga, THE Web_Component `sb-ui-button` SHALL mostrar un `<sb-ui-spinner>` integrado dentro del botón

### Requerimiento 10: Migración del Layout y Navegación al Tema Corporativo

**User Story:** Como usuario del portal, quiero que el sidebar de navegación y el header sigan el tema corporativo de Seguros Bolívar, para tener una experiencia visual unificada.

#### Criterios de Aceptación

1. THE Frontend SHALL reemplazar los colores indigo (`bg-indigo-600`, `bg-indigo-50`, `text-indigo-700`, `text-indigo-600`) en el sidebar de AppLayout por los colores corporativos de la Marca_Seguros_Bolívar usando tokens CSS del Design System
2. WHEN un enlace de navegación está activo, THE Frontend SHALL aplicar el estilo activo usando los tokens de color primario de la Marca_Seguros_Bolívar en lugar de `bg-indigo-50 text-indigo-700`
3. THE Frontend SHALL reemplazar los colores indigo en el layout de autenticación (AuthLayout) por los colores corporativos de la Marca_Seguros_Bolívar
4. THE Frontend SHALL usar el componente `<sb-ui-breadcrumb>` donde sea apropiado para la navegación jerárquica (ej: Catálogo > Detalle de API)

### Requerimiento 11: Compatibilidad con React y Funcionalidad Existente

**User Story:** Como desarrollador frontend, quiero que la integración de Bolívar UI sea compatible con el stack React existente, para que no se rompa ninguna funcionalidad actual.

#### Criterios de Aceptación

1. THE Frontend SHALL mantener la funcionalidad de React Hook Form para validación de formularios, conectando los Web_Component de Bolívar_UI mediante wrappers React o event listeners que propaguen valores al estado del formulario
2. THE Frontend SHALL mantener la funcionalidad de React Query para gestión de datos del servidor sin modificar las queries ni mutations existentes
3. THE Frontend SHALL mantener la funcionalidad del Auth_Context (login, logout, registro, protección de rutas) sin cambios en la lógica de autenticación
4. THE Frontend SHALL mantener la funcionalidad de React Router para navegación entre páginas sin cambios en la estructura de rutas
5. THE Frontend SHALL mantener la funcionalidad de Sonner para notificaciones toast sin conflictos con los Web_Component de Bolívar_UI
6. IF un Web_Component de Bolívar_UI no está disponible para un elemento específico, THEN THE Frontend SHALL mantener el elemento HTML nativo estilizado con tokens CSS de la Marca_Seguros_Bolívar

### Requerimiento 12: Cumplimiento de Reglas CSS del Design System

**User Story:** Como desarrollador frontend, quiero que los estilos personalizados sigan las reglas CSS del Design System, para mantener consistencia y calidad en el código CSS.

#### Criterios de Aceptación

1. WHEN se escriben estilos CSS personalizados para complementar los Web_Component, THE Frontend SHALL usar el prefijo `sb-ui-` en todas las clases CSS y `--sb-ui-` en todas las variables CSS
2. WHEN se escriben estilos CSS personalizados, THE Frontend SHALL usar exclusivamente Logical Properties (`inline-size`, `padding-inline`, `margin-block`) en lugar de Physical Properties (`width`, `padding-left`, `margin-top`)
3. WHEN se definen valores responsive, THE Frontend SHALL usar `clamp()` en lugar de media queries para tamaños
4. WHEN se escriben estilos CSS personalizados, THE Frontend SHALL usar CSS Nesting nativo con `&` y no repetir selectores
5. WHEN se escriben estilos CSS personalizados, THE Frontend SHALL usar `@layer` para control de cascada siguiendo el orden definido en CSS_Rules
6. THE Frontend SHALL incluir soporte de accesibilidad en todos los estilos personalizados: `prefers-reduced-motion`, `prefers-contrast: high`, `:focus-visible` con outline visible, y estado `:disabled`

### Requerimiento 13: Tests Existentes Deben Seguir Pasando

**User Story:** Como desarrollador frontend, quiero que los tests existentes sigan pasando después de la migración, para asegurar que no se introdujeron regresiones.

#### Criterios de Aceptación

1. WHEN se ejecuta `npm run test` en `packages/frontend/`, THE Frontend SHALL pasar todos los tests existentes (Login.test.tsx, Catalog.test.tsx, Sandbox.test.tsx) sin fallos
2. IF un test existente falla debido al cambio de elementos HTML nativos a Web_Component, THEN THE Frontend SHALL actualizar el test para buscar los nuevos elementos manteniendo la misma cobertura funcional
3. THE Frontend SHALL configurar el entorno de testing (Vitest + jsdom) para reconocer los Custom Elements de Bolívar_UI sin errores de renderizado

### Requerimiento 14: Preservación del Flujo Funcional Completo

**User Story:** Como líder técnico, quiero que todos los flujos funcionales del portal sigan operando exactamente igual después de la migración visual, para que la integración de Bolívar UI sea exclusivamente un cambio de presentación sin regresiones funcionales.

#### Criterios de Aceptación — Flujo de Autenticación (Login → Registro → Sesión)

1. WHEN el usuario envía el formulario de Login con email y password, THE Frontend SHALL ejecutar `POST /v1/auth/login` con el mismo payload `{ email, password }`, recibir `{ accessToken, consumer }`, almacenar el JWT en localStorage vía Auth_Context y redirigir a `/catalog` — exactamente igual que antes de la migración
2. WHEN el usuario envía el formulario de Register con los 6 campos (email, password, confirmPassword, companyName, businessProfile, contactName), THE Frontend SHALL ejecutar `POST /v1/auth/register` con el mismo payload, mostrar toast de éxito vía Sonner y redirigir a `/login` — exactamente igual que antes de la migración
3. WHEN la validación Zod detecta errores en Login o Register, THE Frontend SHALL mostrar los mensajes de error junto a cada campo (ej: "Correo electrónico inválido", "La contraseña debe tener al menos 8 caracteres", "Las contraseñas no coinciden") sin cambios en la lógica de validación
4. WHEN el usuario hace clic en "Salir" o el interceptor Axios recibe un 401, THE Frontend SHALL limpiar el JWT de localStorage, resetear Auth_Context y redirigir a `/login` — sin cambios en la lógica del interceptor de `src/lib/api.ts`
5. THE Frontend SHALL preservar los links de navegación entre Login y Register ("¿No tienes cuenta? Regístrate" / "¿Ya tienes cuenta? Inicia sesión") con la misma funcionalidad de React Router

#### Criterios de Aceptación — Flujo de Catálogo (Listado → Filtros → Detalle)

6. WHEN el usuario navega a `/catalog`, THE Frontend SHALL cargar la lista de APIs vía React Query (`queryKey: ['catalog-apis']`), renderizar las cards con nombre, descripción, versión, estado (badge de color) y categoría, y mostrar el badge "Deprecada" con fecha sunset para APIs con `status === 'deprecated'` — sin cambios en la lógica de datos
7. WHEN el usuario escribe en el campo de búsqueda, selecciona una categoría o un estado, THE Frontend SHALL filtrar las APIs en memoria usando la misma lógica de `useMemo` existente — sin cambios en los filtros
8. WHEN el usuario hace clic en una card de API, THE Frontend SHALL navegar a `/catalog/:id` usando React Router y renderizar el detalle con las 3 pestañas (Documentación, Snippets, Versiones) — sin cambios en la navegación
9. WHEN el usuario selecciona un lenguaje de snippet (JavaScript, Python, Java, cURL), THE Frontend SHALL mostrar el código correspondiente con formato monoespaciado y funcionalidad de copiado — sin cambios en la lógica de snippets

#### Criterios de Aceptación — Flujo de Sandbox (Configurar → Ejecutar → Historial)

10. WHEN el usuario selecciona una API, versión, método HTTP, escribe un path, configura headers key-value y body JSON, y hace clic en "Ejecutar", THE Frontend SHALL ejecutar la lógica de mock (o la llamada real a `POST /v1/sandbox/execute` cuando se integre con Dev 3) y mostrar la respuesta con statusCode, headers y body formateado — sin cambios en la lógica de ejecución
11. WHEN una petición se ejecuta, THE Frontend SHALL agregar la entrada al historial local (máximo 20 entradas) con método, path, statusCode y tiempo — sin cambios en la gestión del historial
12. WHEN el usuario agrega o elimina headers en el editor key-value, THE Frontend SHALL actualizar el estado local de headers — sin cambios en la lógica de edición dinámica

#### Criterios de Aceptación — Flujo de Analytics (Métricas → Cuota → Filtros → Tabla)

13. WHEN el usuario navega a `/analytics`, THE Frontend SHALL cargar métricas vía React Query (`queryKey: ['analytics']`) y renderizar las 4 cards (Total Peticiones, Tasa Éxito, Tasa Error, Latencia Promedio), la barra de cuota con colores semáforo (verde <60%, amarillo 60-80%, rojo >80%), y la tabla de peticiones recientes — sin cambios en la lógica de datos
14. WHEN el usuario cambia los filtros de fecha (desde/hasta) o selecciona una API específica, THE Frontend SHALL filtrar los datos correspondientes — sin cambios en la lógica de filtrado

#### Criterios de Aceptación — Flujo de Administración (Consumidores → Acciones → Modales)

15. WHEN el usuario navega a `/admin/consumers`, THE Frontend SHALL cargar la lista de consumidores vía React Query (`queryKey: ['admin-consumers']`), renderizar la tabla con empresa, email, estado, # apps y fecha registro, y permitir búsqueda por empresa o email — sin cambios en la lógica de datos
16. WHEN el usuario hace clic en "Aprobar", "Suspender" o "Revocar", THE Frontend SHALL abrir un modal de confirmación con campo de motivo obligatorio, y al confirmar ejecutar la acción (o la llamada real a `PUT /v1/admin/consumers/:id/status` cuando se integre con Dev 1) — sin cambios en la lógica de acciones
17. WHEN el usuario navega a `/admin/apis`, THE Frontend SHALL cargar la lista de APIs gestionadas vía React Query (`queryKey: ['admin-apis']`), renderizar cada API con sus versiones y acciones (Publicar Versión, Plan Sunset), y abrir los modales correspondientes con formularios funcionales — sin cambios en la lógica de gestión

#### Criterios de Aceptación — Flujo de Notificaciones (Listado → Filtro → Marcar leída)

18. WHEN el usuario navega a `/notifications`, THE Frontend SHALL cargar notificaciones vía React Query (`queryKey: ['notifications']`), renderizar la lista con icono por tipo, título, mensaje, fecha, prioridad (badge) y badge de no leídas — sin cambios en la lógica de datos
19. WHEN el usuario hace clic en una notificación no leída, THE Frontend SHALL marcarla como leída actualizando el estado local `readIds` — sin cambios en la lógica de marcado
20. WHEN el usuario alterna entre las pestañas "Todas" y "No leídas", THE Frontend SHALL filtrar las notificaciones correspondientes — sin cambios en la lógica de filtrado

#### Criterios de Aceptación — Navegación y Layout

21. THE Frontend SHALL preservar la estructura de rutas de React Router sin cambios: `/login`, `/register`, `/catalog`, `/catalog/:id`, `/sandbox`, `/analytics`, `/notifications`, `/admin/consumers`, `/admin/apis`, y el catch-all `*` → `/login`
22. THE Frontend SHALL preservar el sidebar de AppLayout con los 6 links de navegación (Catálogo, Sandbox, Analytics, Notificaciones, Admin: Consumidores, Admin: APIs) con la misma funcionalidad de NavLink activo/inactivo y el comportamiento responsive (sidebar colapsable en mobile)
23. THE Frontend SHALL preservar el header con nombre del usuario (desde Auth_Context) y botón de logout funcional
24. THE Frontend SHALL preservar el AuthLayout centrado para las páginas de Login y Register

#### Criterios de Aceptación — Datos Mock y Preparación para Integración

25. THE Frontend SHALL preservar todos los datos mock hardcodeados (MOCK_APIS, MOCK_CONSUMERS, MOCK_METRICS, MOCK_REQUESTS, MOCK_NOTIFICATIONS, MOCK_MANAGED_APIS) sin modificar su estructura, para que la integración futura con los backends de Dev 1-4 solo requiera reemplazar las funciones `fetch*` por llamadas Axios reales
26. THE Frontend SHALL preservar las interfaces TypeScript de datos (ApiItem, Consumer, MetricCard, RequestRow, Notification, ManagedApi, ApiVersion, Header, HistoryEntry, MockResponse) sin cambios en sus campos ni tipos
27. THE Frontend SHALL preservar la configuración de React Query (staleTime, retry, refetchOnWindowFocus) y los queryKeys existentes sin cambios

### Requerimiento 15: Aislamiento del Alcance de Cambios

**User Story:** Como líder técnico, quiero que la integración de Bolívar UI solo modifique archivos dentro de `packages/frontend/`, para no afectar el trabajo de los demás desarrolladores del equipo.

#### Criterios de Aceptación

1. THE Frontend SHALL modificar exclusivamente archivos dentro del directorio `packages/frontend/`
2. THE Frontend SHALL mantener los contratos de API (endpoints, payloads, headers) sin cambios, asegurando compatibilidad con los backends en puertos 3000, 3002, 3003 y 3004
3. THE Frontend SHALL mantener la configuración de proxy en `vite.config.ts` sin cambios que afecten la conectividad con los servicios backend
4. THE Frontend SHALL mantener el `package.json` con las mismas dependencias existentes (React, React Router, React Query, React Hook Form, Zod, Axios, Lucide React, Sonner) sin eliminar ni cambiar versiones de ninguna — solo se permite agregar dependencias nuevas si son necesarias para la integración de Bolívar_UI
