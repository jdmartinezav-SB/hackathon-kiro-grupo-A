# Select Options Rendering Bugfix Design

## Overview

The `SbSelect` React wrapper component renders a `<sb-ui-select>` custom element tag, but the Bolívar UI Design System specifies that the select component should be a **native `<select>` element** with the CSS class `sb-ui-select`. Because `<sb-ui-select>` is not recognized by the browser as a native form control, `<option>` children are not rendered as dropdown items — the select appears broken across all pages that use it (Catalog, Sandbox, Analytics, Register).

The fix replaces the custom element with a native `<select className="sb-ui-select">`, simplifies event handling to use standard DOM events, and wraps the select in an `sb-ui-input-container` when `label` or `errorMessage` props are provided — matching the Design System's documented pattern for form fields with labels and helper text.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — `SbSelect` renders a `<sb-ui-select>` custom element instead of a native `<select>`, causing `<option>` children to not function as dropdown items
- **Property (P)**: The desired behavior — `SbSelect` renders a native `<select class="sb-ui-select">` with fully functional `<option>` children displayed as a native dropdown
- **Preservation**: Existing prop forwarding (`value`, `disabled`, `name`, `className`, `data-testid`), `onChange`/`onBlur` callback behavior, `ref` imperative access, and consumer page functionality must remain unchanged
- **SbSelect**: The React wrapper component at `packages/frontend/src/components/ui/SbSelect.tsx` that abstracts the Design System's select element
- **sb-ui-input-container**: The Design System's wrapper pattern for form fields that includes label, input/select, and helper text elements
- **Consumer pages**: Catalog.tsx, Sandbox.tsx, Analytics.tsx, Register.tsx — pages that render `SbSelect` with `<option>` children

## Bug Details

### Bug Condition

The bug manifests whenever `SbSelect` renders with `<option>` children. The component outputs a `<sb-ui-select>` custom element tag, which the browser does not recognize as a native form control. As a result, `<option>` elements inside it are not treated as dropdown items — they render as plain text or are invisible.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SbSelectRenderInput
  OUTPUT: boolean

  RETURN input.component = SbSelect
         AND input.children CONTAINS one or more <option> elements
         AND renderedElement.tagName ≠ "SELECT"
END FUNCTION
```

### Examples

- **Catalog category filter**: `<SbSelect value={categoryFilter} onChange={...}><option value="">Todas las categorías</option>...</SbSelect>` — renders `<sb-ui-select>` with options visible as plain text, no dropdown appears on click
- **Sandbox API selector**: `<SbSelect value={apiId} onChange={...}>{catalogApis.map(a => <option ...>)}</SbSelect>` — user cannot select an API from a dropdown; options are not interactive
- **Register business profile**: `<SbSelect label="Perfil de negocio" placeholder="Selecciona un perfil" ...><option value="">Selecciona un perfil</option>...</SbSelect>` — uses `label`, `placeholder`, `error`, and `errorMessage` props that were passed as custom element attributes; dropdown is non-functional
- **Analytics API filter**: `<SbSelect name="api-filter" value={apiFilter} onChange={...}>{MOCK_APIS.map(...)}</SbSelect>` — filter dropdown is broken, user cannot filter analytics by API

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The `onChange` callback must continue to be invoked with the selected `string` value when the user picks an option
- The `onBlur` callback must continue to be invoked when the select loses focus
- Props `value`, `disabled`, `name`, `className`, and `data-testid` must continue to be forwarded to the rendered select element
- The `ref` must continue to expose `.value` (get/set) and `.focus()` via `useImperativeHandle`
- Consumer pages (Catalog, Sandbox, Analytics, Register) must continue to work without any changes to their JSX — the `SbSelect` API (props interface) must remain identical
- The `SbSelectProps` TypeScript interface must remain unchanged so no consumer code breaks

**Scope:**
All inputs that do NOT involve the rendering of the select element itself should be completely unaffected by this fix. This includes:
- All other UI components (SbInput, SbButton, SbTextarea, etc.)
- Page-level logic (filtering, form validation, API calls)
- The TypeScript type declaration for `sb-ui-select` in `bolivar-ui.d.ts` (can remain, harmless)

## Hypothesized Root Cause

Based on the code analysis, the root cause is confirmed (not hypothesized):

1. **Wrong element tag**: `SbSelect` renders `<sb-ui-select>` (a custom element) instead of `<select>` (a native HTML element). The browser does not know that `<sb-ui-select>` should behave as a form select control, so `<option>` children are not recognized as dropdown items.

2. **Unnecessary event complexity**: The component listens for both `sb-change` (CustomEvent) and `change` events with `{ capture: true }`. A native `<select>` fires standard `change` events that bubble normally — no capture phase or custom event handling is needed.

3. **Incorrect ref type**: The `innerRef` is typed as `HTMLElement` and the component is `forwardRef<HTMLElement, ...>`. With a native `<select>`, the ref should be `HTMLSelectElement`, and `useImperativeHandle` can be simplified since `HTMLSelectElement` already has `.value` and `.focus()`.

4. **Custom element attributes for label/error**: Props like `label`, `errorMessage`, `error`, and `placeholder` are passed as attributes to the custom element. A native `<select>` does not have these attributes. The Design System pattern uses an `sb-ui-input-container` wrapper with `sb-ui-input-label` and `sb-ui-input-helper` elements for labels and helper text. The `placeholder` prop should be handled via a disabled first `<option>`.

## Correctness Properties

Property 1: Bug Condition - Native Select Rendering

_For any_ `SbSelect` render where `<option>` children are provided, the fixed component SHALL output a native `<select>` element with the CSS class `sb-ui-select`, and all `<option>` children SHALL be rendered inside it as a fully functional native dropdown list that the user can open, browse, and select from.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Props, Callbacks, and Ref Behavior

_For any_ `SbSelect` render (with or without `<option>` children), the fixed component SHALL continue to forward `value`, `disabled`, `name`, `className`, and `data-testid` to the select element, invoke `onChange` with the selected string value on selection, invoke `onBlur` on focus loss, and expose `.value` and `.focus()` through the forwarded ref — producing the same observable behavior as the original component for all consumer pages.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `packages/frontend/src/components/ui/SbSelect.tsx`

**Function**: `SbSelect` (the entire component)

**Specific Changes**:

1. **Replace custom element with native `<select>`**: Change the JSX from `<sb-ui-select ref={innerRef} ...>{children}</sb-ui-select>` to `<select ref={innerRef} className="sb-ui-select" ...>{children}</select>`. Merge the `sb-ui-select` class with any additional `className` prop.

2. **Simplify event handling**: Remove the `useEffect` that manually adds `sb-change`, `change`, and `blur` event listeners. Instead, use React's standard `onChange` and `onBlur` JSX props on the native `<select>`. The `onChange` handler extracts `e.target.value` and calls the `onChange` prop. The `onBlur` handler calls the `onBlur` prop.

3. **Update ref type**: Change `forwardRef<HTMLElement, SbSelectProps>` to `forwardRef<HTMLSelectElement, SbSelectProps>`. Change `useRef<HTMLElement>(null)` to `useRef<HTMLSelectElement>(null)`. Simplify `useImperativeHandle` — since `HTMLSelectElement` already has `.value` and `.focus()`, the imperative handle can simply return the element directly (or be removed entirely if the ref is passed through).

4. **Handle label, error, and helper text via wrapper**: When `label` or `errorMessage` is provided, wrap the `<select>` in a `<div className="sb-ui-input-container">` with:
   - `<label className="sb-ui-input-label">{label}</label>` if `label` is provided
   - The `<select>` element (with `sb-ui-select--error` class if `error` is true)
   - `<span className="sb-ui-input-helper">{errorMessage}</span>` if `errorMessage` is provided

5. **Handle placeholder via disabled option**: If `placeholder` is provided and no explicit placeholder option exists in children, the component does not need to inject one — consumers already provide their own placeholder options (e.g., `<option value="">Selecciona un perfil</option>`). The `placeholder` prop can be kept in the interface for backward compatibility but is not rendered as an attribute on the native `<select>`.

6. **Remove unused imports**: Remove `useEffect` and `useCallback` imports since event handling is now declarative via React props.

**File**: `packages/frontend/src/components/ui/__tests__/SbSelect.test.tsx`

**Changes**: Update tests to query for a native `<select>` element instead of `sb-ui-select` custom element. Update event dispatching to use standard `change` events on the `<select>`. Update attribute assertions to check for `className` instead of custom element attributes.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Write tests that render `SbSelect` with `<option>` children and assert that the rendered output is a native `<select>` element. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Native element check**: Render `SbSelect` with options, assert `container.querySelector('select')` is not null (will fail on unfixed code — finds `sb-ui-select` instead)
2. **CSS class check**: Assert the rendered element has `className` containing `sb-ui-select` (will fail on unfixed code — custom element uses tag name, not class)
3. **Option recognition**: Assert `select.options.length` matches the number of `<option>` children (will fail on unfixed code — `HTMLElement` has no `.options` property)
4. **Change event**: Simulate selecting an option via native `change` event and assert `onChange` is called (may fail on unfixed code due to event handling differences)

**Expected Counterexamples**:
- `container.querySelector('select')` returns `null` because the element is `<sb-ui-select>`
- `.options` property is undefined on the custom element
- Native `change` events may not propagate correctly from `<option>` children inside a custom element

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := SbSelect_fixed(input)
  ASSERT result.rootElement.tagName = "SELECT"
  ASSERT result.rootElement.classList.contains("sb-ui-select")
  ASSERT result.options.length = count(input.children WHERE tagName = "option")
  ASSERT selecting an option fires onChange with correct value
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT SbSelect_original(input).props = SbSelect_fixed(input).props
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many combinations of props (value, disabled, name, className, etc.) automatically
- It catches edge cases like empty children, undefined props, or unusual className combinations
- It provides strong guarantees that the prop-forwarding behavior is unchanged

**Test Plan**: Observe behavior on UNFIXED code first for prop forwarding and callback invocation, then write tests capturing that behavior.

**Test Cases**:
1. **Prop forwarding preservation**: Verify `value`, `disabled`, `name`, `className`, `data-testid` are forwarded to the rendered element
2. **onChange preservation**: Verify `onChange` is called with the correct string value when a selection is made
3. **onBlur preservation**: Verify `onBlur` is called when the select loses focus
4. **Ref preservation**: Verify the ref exposes `.value` and `.focus()` correctly
5. **Label/error rendering**: Verify `label` renders as `sb-ui-input-label` and `errorMessage` renders as `sb-ui-input-helper`

### Unit Tests

- Test that `SbSelect` renders a native `<select>` with class `sb-ui-select`
- Test that `<option>` children are rendered inside the `<select>`
- Test that `onChange` fires with the correct value on selection
- Test that `onBlur` fires on blur
- Test that `disabled` prop disables the select
- Test that `label` prop renders a label element
- Test that `error` and `errorMessage` props render error state and helper text
- Test that `className` is merged with `sb-ui-select`
- Test that `data-testid` is forwarded

### Property-Based Tests

- Generate random combinations of SbSelect props and verify the native `<select>` always has class `sb-ui-select`
- Generate random option lists and verify all options are rendered inside the `<select>`
- Generate random prop combinations and verify forwarding (value, disabled, name, className, data-testid)

### Integration Tests

- Test Catalog page category filter works with the fixed SbSelect
- Test Sandbox page API/version/method selectors work with the fixed SbSelect
- Test Register page business profile selector works with form validation
- Test Analytics page API filter works with the fixed SbSelect
