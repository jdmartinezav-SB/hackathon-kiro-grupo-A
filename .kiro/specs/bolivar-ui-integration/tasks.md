# Plan de Implementación: Integración Bolívar UI Design System

## Resumen

Migración visual del frontend Conecta 2.0 desde componentes HTML nativos con Tailwind (esquema indigo) hacia los Web Components del Design System de Seguros Bolívar (`sb-ui-*`), cargados vía CDN. La migración es página por página, manteniendo toda la lógica funcional intacta (React Hook Form, React Query, Auth Context, Router, Sonner). Se usa TypeScript para todos los archivos nuevos y modificados.

## Tareas

- [x] 1. Infraestructura base: CDN, tipos TypeScript, CSS global y dependencia fast-check
  - [x] 1.1 Configurar carga CDN y marca corporativa en `index.html`
    - Agregar `data-brand="seguros-bolivar"` al elemento `<html>`
    - Agregar `<link rel="stylesheet">` para estilos Bolívar UI desde CDN
    - Agregar `<script type="module">` para componentes Bolívar UI desde CDN
    - Agregar handler `onerror` en el script CDN que establezca `window.__SB_UI_LOADED__ = false`
    - _Requerimientos: 1.1, 1.2, 1.4, 2.1_

  - [x] 1.2 Crear declaraciones de tipos TypeScript en `src/types/bolivar-ui.d.ts`
    - Declarar `JSX.IntrinsicElements` para todos los Web Components: `sb-ui-button`, `sb-ui-input`, `sb-ui-select`, `sb-ui-table`, `sb-ui-tabs`, `sb-ui-modal`, `sb-ui-alert`, `sb-ui-spinner`, `sb-ui-breadcrumb`
    - Incluir todas las props tipadas según el diseño (variant, style-type, size, disabled, loading, error, error-message, etc.)
    - _Requerimientos: 1.3_

  - [x] 1.3 Actualizar `src/index.css` con tokens CSS del tema corporativo
    - Mantener `@import "tailwindcss"` existente
    - Agregar `@layer base` con variables CSS corporativas bajo `[data-brand="seguros-bolivar"]`: `--sb-ui-color-primary-base: #009056`, `--sb-ui-color-primary-D100: #038450`, `--sb-ui-color-primary-L400: #F2F9F6`
    - _Requerimientos: 2.2, 2.4, 12.1, 12.5_

  - [x] 1.4 Agregar `fast-check` como devDependency en `packages/frontend/package.json`
    - Agregar `"fast-check": "^3.22.0"` en devDependencies
    - Ejecutar `npm install` en `packages/frontend/`
    - _Requerimientos: 13.3_

  - [x] 1.5 Configurar stubs de Custom Elements en `src/test/setup.ts`
    - Registrar stubs mínimos para los 9 Custom Elements (`sb-ui-button`, `sb-ui-input`, `sb-ui-select`, `sb-ui-table`, `sb-ui-tabs`, `sb-ui-modal`, `sb-ui-alert`, `sb-ui-spinner`, `sb-ui-breadcrumb`) usando `customElements.define()` con clases que extiendan `HTMLElement`
    - Mantener el import existente de `@testing-library/jest-dom/vitest`
    - _Requerimientos: 13.3_

- [x] 2. Capa de wrappers React en `src/components/ui/`
  - [x] 2.1 Crear wrapper `SbButton.tsx`
    - Implementar con `forwardRef` + `useImperativeHandle`
    - Traducir props React (`variant`, `styleType`, `size`, `disabled`, `loading`, `type`, `onClick`, `children`) a atributos del Custom Element `<sb-ui-button>`
    - Escuchar evento nativo `click` y re-emitir como callback React `onClick`
    - Bloquear clicks cuando `disabled` o `loading` es `true`
    - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 9.2_

  - [x] 2.2 Crear wrapper `SbInput.tsx`
    - Implementar con `forwardRef` + `useImperativeHandle` para compatibilidad con React Hook Form
    - Traducir props React (`type`, `value`, `placeholder`, `disabled`, `error`, `errorMessage`, `label`, `name`, `id`, `autoComplete`, `onChange`, `onBlur`) a atributos/propiedades del Custom Element `<sb-ui-input>`
    - Escuchar eventos nativos `sb-change`, `change` y `blur` y re-emitirlos como callbacks React
    - Exponer `.value`, `.focus()` vía `useImperativeHandle`
    - _Requerimientos: 4.1, 4.4, 4.5, 11.1_

  - [x] 2.3 Crear wrapper `SbSelect.tsx`
    - Implementar con `forwardRef` + `useImperativeHandle`
    - Traducir props React (`value`, `placeholder`, `disabled`, `error`, `label`, `name`, `onChange`, `onBlur`, `children`) a atributos del Custom Element `<sb-ui-select>`
    - Escuchar eventos nativos `sb-change`, `change` y `blur`
    - Renderizar opciones como children del Web Component
    - _Requerimientos: 4.2, 4.4, 4.5, 11.1_

  - [x] 2.4 Crear wrapper `SbTextarea.tsx`
    - Implementar con `forwardRef` + `useImperativeHandle`
    - Traducir props React (`value`, `placeholder`, `disabled`, `rows`, `onChange`, `onBlur`) al Custom Element `<sb-ui-input>` con variante textarea o equivalente
    - _Requerimientos: 4.3, 4.5_

  - [x] 2.5 Crear wrapper `SbTable.tsx`
    - Renderizar `<sb-ui-table>` con children para columnas y filas
    - Aceptar props para estructura tabular (headers, rows) o children directos
    - _Requerimientos: 5.1_

  - [x] 2.6 Crear wrapper `SbTabs.tsx`
    - Renderizar `<sb-ui-tabs>` con gestión de tab activo
    - Aceptar props `activeTab`, `onTabChange`, `tabs` (array de labels) y `children` (paneles)
    - Escuchar evento nativo de cambio de tab y re-emitir como callback React
    - Mostrar solo el panel correspondiente al tab activo
    - _Requerimientos: 6.1, 6.3_

  - [x] 2.7 Crear wrapper `SbModal.tsx`
    - Renderizar `<sb-ui-modal>` con props `open`, `title`, `onClose`, `children`
    - Escuchar evento nativo de cierre (Escape, click fuera) y re-emitir como `onClose`
    - _Requerimientos: 7.1, 7.3, 7.4_

  - [x] 2.8 Crear wrapper `SbAlert.tsx`
    - Renderizar `<sb-ui-alert>` con props `variant` (`info`, `success`, `warning`, `error`), `closable`, `children`
    - _Requerimientos: 8.1, 8.2_

  - [x] 2.9 Crear wrapper `SbSpinner.tsx`
    - Renderizar `<sb-ui-spinner>` con prop `size` (`small`, `medium`, `large`)
    - _Requerimientos: 9.1_

  - [x] 2.10 Crear wrapper `SbBreadcrumb.tsx`
    - Renderizar `<sb-ui-breadcrumb>` con children para items de navegación
    - _Requerimientos: 10.4_

  - [x] 2.11 Crear archivo barrel `src/components/ui/index.ts`
    - Re-exportar todos los wrappers desde un punto de entrada único
    - _Requerimientos: 11.1_

  - [ ]* 2.12 Escribir property test: Forwarding de props booleanas en wrappers interactivos
    - **Property 1: Forwarding de props booleanas**
    - Usar `fast-check` con `fc.boolean()` para generar combinaciones de `disabled` y `loading`
    - Renderizar `SbButton` con las props generadas y verificar que los atributos HTML del Custom Element coincidan
    - Verificar que cuando `disabled` es `true`, el callback `onClick` no se invoca
    - Mínimo 100 iteraciones
    - **Valida: Requerimientos 3.3, 3.4, 9.2**

  - [ ]* 2.13 Escribir property test: Puente de valores de formulario entre RHF y Web Components
    - **Property 2: Puente de valores de formulario**
    - Usar `fast-check` con `fc.string()` para generar valores aleatorios
    - Simular despacho de evento de cambio desde `SbInput` y verificar que el estado de React Hook Form (vía Controller) contenga exactamente el mismo valor
    - Usar `fc.boolean()` y `fc.string()` para generar estados de error y mensajes, verificar que los atributos `error` y `error-message` se establezcan correctamente
    - Mínimo 100 iteraciones
    - **Valida: Requerimientos 4.4, 4.5, 11.1**

  - [ ]* 2.14 Escribir property test: Selección de tab muestra el panel correcto
    - **Property 3: Selección de tab muestra el panel correcto**
    - Usar `fast-check` con `fc.integer()` para generar N tabs (1 ≤ N ≤ 10) y un índice seleccionado `i` (0 ≤ i < N)
    - Renderizar `SbTabs` con N tabs y verificar que solo el panel `i`-ésimo sea visible
    - Mínimo 100 iteraciones
    - **Valida: Requerimientos 6.3**

- [x] 3. Checkpoint — Verificar infraestructura y wrappers
  - Ejecutar `npm run build` y `npm run test` en `packages/frontend/`
  - Asegurar que todos los tests pasan y el build compila sin errores de tipo
  - Preguntar al usuario si hay dudas antes de continuar con la migración de páginas

- [x] 4. Migrar layouts al tema corporativo
  - [x] 4.1 Migrar `AppLayout.tsx` a colores corporativos
    - Reemplazar `bg-indigo-600` del logo por color corporativo usando tokens CSS (`--sb-ui-color-primary-base`)
    - Reemplazar `bg-indigo-50 text-indigo-700` del NavLink activo por tokens corporativos (`--sb-ui-color-primary-L400`, `--sb-ui-color-primary-D100`)
    - Mantener toda la lógica de sidebar colapsable, NavLink, header, logout sin cambios
    - _Requerimientos: 2.3, 10.1, 10.2, 10.3, 14.22, 14.23_

  - [x] 4.2 Migrar `AuthLayout.tsx` a colores corporativos
    - Reemplazar `bg-indigo-600` del logo por color corporativo
    - Mantener estructura centrada y Outlet sin cambios
    - _Requerimientos: 2.3, 10.3, 14.24_

- [x] 5. Migrar páginas de autenticación (Login, Register)
  - [x] 5.1 Migrar `Login.tsx` a Web Components con Controller pattern
    - Reemplazar `useForm` con `register()` por `useForm` con `control` + `Controller`
    - Reemplazar `<input>` de email por `<Controller>` + `<SbInput type="email">`
    - Reemplazar `<input>` de password por `<Controller>` + `<SbInput type="password">`
    - Reemplazar `<button>` submit por `<SbButton variant="primary" styleType="fill" type="submit" loading={loading}>`
    - Mantener validación Zod, `onSubmit`, `toast`, `navigate`, link a Register sin cambios
    - _Requerimientos: 3.1, 3.5, 4.1, 4.5, 11.1, 14.1, 14.3, 14.5_

  - [x] 5.2 Migrar `Register.tsx` a Web Components con Controller pattern
    - Reemplazar `useForm` con `register()` por `useForm` con `control` + `Controller`
    - Reemplazar 5 `<input>` por `<Controller>` + `<SbInput>` (email, password, confirmPassword, companyName, contactName)
    - Reemplazar `<select>` de businessProfile por `<Controller>` + `<SbSelect>`
    - Reemplazar `<button>` submit por `<SbButton variant="primary" styleType="fill" type="submit" loading={loading}>`
    - Mantener validación Zod con `.refine()`, `onSubmit`, `toast`, `navigate`, link a Login sin cambios
    - _Requerimientos: 3.1, 3.5, 4.1, 4.2, 4.5, 4.6, 11.1, 14.2, 14.3, 14.5_

- [x] 6. Migrar páginas de consulta (Catalog, ApiDetail, Notifications)
  - [x] 6.1 Migrar `Catalog.tsx` a Web Components
    - Reemplazar `<input>` de búsqueda por `<SbInput>` (sin Controller, controlado con `value`/`onChange` directo)
    - Reemplazar 2 `<select>` de filtros por `<SbSelect>`
    - Agregar `<SbAlert variant="warning">` para badge de API deprecada con fecha sunset
    - Mantener `ApiCard`, `useQuery`, `useMemo` de filtrado, `navigate` sin cambios en lógica
    - _Requerimientos: 3.5, 4.1, 4.2, 8.2, 14.6, 14.7, 14.8_

  - [x] 6.2 Migrar `ApiDetail.tsx` a Web Components
    - Reemplazar tabs manuales (botones con `border-b-2 border-indigo-600`) por `<SbTabs>` con 3 tabs (Documentación, Snippets, Versiones)
    - Agregar `<SbBreadcrumb>` con items: Catálogo > [nombre API]
    - Reemplazar botón "Volver" por `<SbButton variant="secondary" styleType="stroke">`
    - Reemplazar botones de selección de lenguaje de snippet por `<SbButton>` con variante apropiada
    - Mantener `useQuery`, `useParams`, `navigate`, lógica de snippets y versiones sin cambios
    - _Requerimientos: 6.1, 6.2, 6.3, 10.4, 14.8, 14.9_

  - [x] 6.3 Migrar `Notifications.tsx` a Web Components
    - Reemplazar tabs manuales (botones con `border-indigo-600`) por `<SbTabs>` con 2 tabs (Todas, No leídas)
    - Agregar `<SbAlert variant="error">` para notificaciones con prioridad `urgent`
    - Mantener `useQuery`, `useMemo`, `readIds`, `markAsRead` sin cambios en lógica
    - _Requerimientos: 6.1, 6.2, 6.3, 8.1, 14.18, 14.19, 14.20_

- [x] 7. Migrar páginas complejas (Sandbox, Analytics)
  - [x] 7.1 Migrar `Sandbox.tsx` a Web Components
    - Reemplazar 2 `<select>` (API, Versión) por `<SbSelect>`
    - Reemplazar `<select>` de método HTTP por `<SbSelect>`
    - Reemplazar `<input>` de path por `<SbInput>`
    - Reemplazar inputs de headers key-value por `<SbInput>` en `HeaderRow`
    - Reemplazar `<textarea>` de body por `<SbTextarea>`
    - Reemplazar botón "Ejecutar" por `<SbButton variant="primary" styleType="fill" loading={loading}>` con `<SbSpinner>` integrado
    - Reemplazar botón "Agregar" header por `<SbButton variant="secondary" styleType="text">`
    - Mantener toda la lógica de `execute`, `handleApiChange`, `history`, `response` sin cambios
    - _Requerimientos: 3.1, 3.5, 4.1, 4.2, 4.3, 9.1, 14.10, 14.11, 14.12_

  - [x] 7.2 Migrar `Analytics.tsx` a Web Components
    - Reemplazar 2 `<input type="date">` (desde, hasta) por `<SbInput type="date">`
    - Reemplazar `<select>` de filtro API por `<SbSelect>`
    - Reemplazar `<table>` de peticiones recientes por `<SbTable>` con columnas: Endpoint, Método, Status, Latencia, Fecha
    - Mantener cards de métricas, barra de cuota, `useQuery`, lógica de filtrado sin cambios
    - _Requerimientos: 4.1, 4.2, 5.1, 5.2, 14.13, 14.14_

- [x] 8. Checkpoint — Verificar migración de páginas principales
  - Ejecutar `npm run build` y `npm run test` en `packages/frontend/`
  - Asegurar que todos los tests pasan y el build compila sin errores
  - Preguntar al usuario si hay dudas antes de continuar con páginas admin

- [x] 9. Migrar páginas de administración (ConsumerManagement, ApiManagement)
  - [x] 9.1 Migrar `ConsumerManagement.tsx` a Web Components
    - Reemplazar `<input>` de búsqueda por `<SbInput>`
    - Reemplazar `<table>` de consumidores por `<SbTable>` con columnas: Empresa, Email, Estado, # Apps, Fecha Registro, Acciones
    - Reemplazar 3 botones de acción (Aprobar, Suspender, Revocar) por `<SbButton>` con variantes apropiadas
    - Reemplazar `ConfirmModal` (div con `fixed inset-0 z-50`) por `<SbModal>` con props `open`, `title`, `onClose`
    - Reemplazar `<textarea>` de motivo dentro del modal por `<SbTextarea>`
    - Reemplazar botones del modal (Cancelar, Confirmar) por `<SbButton>` con variantes `secondary`/`primary`
    - Mantener `useQuery`, `useMemo`, `handleConfirm`, lógica de modal sin cambios
    - _Requerimientos: 3.1, 3.2, 3.5, 4.1, 4.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 14.15, 14.16_

  - [x] 9.2 Migrar `ApiManagement.tsx` a Web Components
    - Reemplazar botón "Nueva API" por `<SbButton variant="primary" styleType="fill">`
    - Reemplazar botones "Publicar Versión" y "Plan Sunset" por `<SbButton variant="secondary" styleType="stroke">`
    - Reemplazar `Modal` wrapper (div con `fixed inset-0 z-50`) por `<SbModal>`
    - Reemplazar `<input>` de nombre, descripción, categoría por `<SbInput>`
    - Reemplazar `<textarea>` de spec OpenAPI por `<SbTextarea>`
    - Reemplazar `<input type="date">` de sunset por `<SbInput type="date">`
    - Reemplazar botones de modal (Cancelar, Crear/Publicar/Programar) por `<SbButton>`
    - Mantener `useQuery`, estado de modales, `closeModal` sin cambios
    - _Requerimientos: 3.1, 3.2, 3.5, 4.1, 4.3, 7.1, 7.2, 14.17_

- [x] 10. Actualizar tests existentes y agregar tests de regresión
  - [x] 10.1 Actualizar `Login.test.tsx` para nuevos elementos
    - Actualizar queries que buscan `<input>` y `<button>` nativos para que funcionen con Custom Elements stubs
    - Verificar que `screen.getByLabelText(/correo electrónico/i)` sigue encontrando el campo (o actualizar a `data-testid` si jsdom no resuelve labels en Custom Elements)
    - Verificar que `screen.getByRole('button', { name: /ingresar/i })` sigue funcionando (o actualizar query)
    - Mantener la misma cobertura funcional
    - _Requerimientos: 13.1, 13.2_

  - [x] 10.2 Actualizar `Catalog.test.tsx` para nuevos elementos
    - Actualizar queries para buscar campos de búsqueda y filtros en Custom Elements
    - Verificar que `screen.getByPlaceholderText(...)` y `screen.getByRole('combobox', ...)` siguen funcionando o actualizar
    - Mantener la misma cobertura funcional
    - _Requerimientos: 13.1, 13.2_

  - [x] 10.3 Actualizar `Sandbox.test.tsx` para nuevos elementos
    - Actualizar queries para buscar selector de API y botón ejecutar en Custom Elements
    - Verificar que `screen.getByLabelText(/^api$/i)` y `screen.getByRole('button', { name: /ejecutar/i })` siguen funcionando o actualizar
    - Mantener la misma cobertura funcional
    - _Requerimientos: 13.1, 13.2_

  - [ ]* 10.4 Escribir unit tests para wrappers React
    - Test para `SbButton`: renderiza `<sb-ui-button>`, pasa variant/disabled/loading como atributos
    - Test para `SbInput`: renderiza `<sb-ui-input>`, propaga value/placeholder/error
    - Test para `SbSelect`: renderiza `<sb-ui-select>`, propaga value/children
    - Test para `SbTabs`: renderiza `<sb-ui-tabs>`, muestra panel activo
    - Test para `SbModal`: renderiza `<sb-ui-modal>`, controla open/close
    - _Requerimientos: 13.1, 13.3_

- [x] 11. Checkpoint final — Verificar build, tests y cobertura completa
  - Ejecutar `npm run build` en `packages/frontend/` — debe compilar sin errores
  - Ejecutar `npm run test` en `packages/frontend/` — todos los tests deben pasar (Login, Catalog, Sandbox, property tests, unit tests de wrappers)
  - Verificar que no se modificaron archivos fuera de `packages/frontend/`
  - Verificar que `package.json` mantiene todas las dependencias existentes sin cambios de versión
  - Verificar que `vite.config.ts` no tiene cambios que afecten conectividad con backends
  - Preguntar al usuario si hay dudas o ajustes necesarios
  - _Requerimientos: 13.1, 14.21, 14.25, 14.26, 14.27, 15.1, 15.2, 15.3, 15.4_

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud definidas en el diseño
- Los unit tests validan ejemplos específicos y casos borde
- Toda la migración es exclusivamente visual — la lógica funcional (React Hook Form, React Query, Auth Context, Router, Sonner, datos mock) permanece intacta
- Solo se modifican archivos dentro de `packages/frontend/`
- Tailwind CSS se mantiene para layout (flex, grid, spacing); los componentes interactivos migran a Web Components de Bolívar UI
