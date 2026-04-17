# Tasks

- [x] 1. Refactor SbSelect component to use native `<select>` element
  - [x] 1.1 Replace `<sb-ui-select>` with `<select className="sb-ui-select">` and update ref type from `HTMLElement` to `HTMLSelectElement`
  - [x] 1.2 Simplify event handling: remove `useEffect`/`useCallback` manual listeners, use React `onChange` and `onBlur` props on the native `<select>`
  - [x] 1.3 Simplify `useImperativeHandle` — `HTMLSelectElement` already has `.value` and `.focus()`, so pass the element directly
  - [x] 1.4 Handle `label`, `error`, and `errorMessage` props via `sb-ui-input-container` wrapper pattern (label → `sb-ui-input-label`, error → `sb-ui-select--error` class, errorMessage → `sb-ui-input-helper`)
  - [x] 1.5 Keep `placeholder` prop in the interface for backward compatibility but do not render it as an attribute (consumers already provide placeholder `<option>` elements)
  - [x] 1.6 Merge `className` prop with `sb-ui-select` base class using string concatenation
- [x] 2. Update SbSelect unit tests
  - [x] 2.1 Update test queries to find native `<select>` element instead of `sb-ui-select` custom element
  - [x] 2.2 Update `onChange` test to use React Testing Library `fireEvent.change` on the native `<select>`
  - [x] 2.3 Update `onBlur` test to use `fireEvent.blur` on the native `<select>`
  - [x] 2.4 Update attribute assertion test to check `className`, `disabled`, and `name` on the native `<select>`
  - [x] 2.5 Add test for `label` prop rendering as `sb-ui-input-label` inside `sb-ui-input-container`
  - [x] 2.6 Add test for `error` and `errorMessage` props rendering error state and helper text
- [x] 3. Verify consumer pages work without changes
  - [x] 3.1 Run TypeScript type-check to confirm no type errors in Catalog.tsx, Sandbox.tsx, Analytics.tsx, Register.tsx
  - [x] 3.2 Run existing page-level tests (Catalog.test.tsx, Sandbox.test.tsx) to confirm no regressions
