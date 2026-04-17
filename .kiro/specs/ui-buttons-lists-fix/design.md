# UI Buttons & Lists Fix — Bugfix Design

## Overview

Los wrappers React para los Web Components de Bolívar UI (`SbButton`, `SbInput`, `SbSelect`, `SbTextarea`) no propagan eventos que se originan dentro del Shadow DOM de los custom elements `<sb-ui-button>`, `<sb-ui-input>` y `<sb-ui-select>`. Esto rompe clicks en botones, cambios de valor en inputs/selects/textareas y actualizaciones en tiempo real por keystroke en todo el portal Conecta 2.0.

**Estrategia de fix:** Agregar `{ capture: true }` a los `addEventListener` existentes para interceptar eventos en la fase de captura antes de que el Shadow DOM los detenga, y añadir listeners para el evento `input` en `SbInput` y `SbTextarea` para capturar keystrokes en tiempo real.

## Glossary

- **Bug_Condition (C)**: Interacción del usuario con un wrapper React de Bolívar UI cuyo evento se origina dentro del Shadow DOM del custom element y no es capturado por el listener en el host element
- **Property (P)**: El callback React (`onClick`, `onChange`) se invoca correctamente con el valor esperado cuando el usuario interactúa con el componente
- **Preservation**: Comportamientos existentes que no deben cambiar: botones disabled/loading bloquean clicks, `onBlur` sigue funcionando, atributos se pasan correctamente al Web Component, `SbTabs` sigue funcionando con su onClick nativo
- **Shadow DOM**: Encapsulación del DOM interno de un Web Component; los eventos que se originan dentro pueden no propagarse al host element con `addEventListener` en fase de burbujeo
- **Capture phase**: Fase de propagación de eventos donde el listener se ejecuta durante el descenso del evento por el DOM tree, antes de llegar al target — permite interceptar eventos del Shadow DOM
- **`<sb-ui-button>`**: Custom element de Bolívar UI Design System que renderiza un botón con Shadow DOM interno
- **`<sb-ui-input>`**: Custom element de Bolívar UI que renderiza un input (o textarea cuando tiene atributo `rows`) con Shadow DOM interno
- **`<sb-ui-select>`**: Custom element de Bolívar UI que renderiza un select con Shadow DOM interno

## Bug Details

### Bug Condition

El bug se manifiesta cuando el usuario interactúa con cualquiera de los 4 wrappers React (`SbButton`, `SbInput`, `SbSelect`, `SbTextarea`) y el evento de interacción se origina dentro del Shadow DOM del custom element subyacente. Los `addEventListener` actuales escuchan en fase de burbujeo (default), lo cual no captura eventos que se originan y se detienen dentro del Shadow DOM. Adicionalmente, `SbInput` y `SbTextarea` no escuchan el evento `input`, por lo que no capturan keystrokes en tiempo real.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction
  OUTPUT: boolean

  // Sub-condition 1: Shadow DOM event not captured
  shadowDomBlocked :=
    input.targetComponent IN {SbButton, SbInput, SbSelect, SbTextarea}
    AND input.eventOrigin = "shadow-dom"
    AND input.listenerPhase = "bubble" (default)

  // Sub-condition 2: Missing 'input' event listener for real-time updates
  missingInputEvent :=
    input.targetComponent IN {SbInput, SbTextarea}
    AND input.eventType = "keystroke"
    AND "input" NOT IN registeredEventListeners(input.targetComponent)

  RETURN shadowDomBlocked OR missingInputEvent
END FUNCTION
```

### Examples

- **SbButton click en Login**: El usuario hace click en "Ingresar" (`Login.tsx`). El click se origina en el `<button>` interno del Shadow DOM de `<sb-ui-button>`. El `addEventListener('click', handleClick)` en el host element no lo captura → `onClick` nunca se invoca → el formulario no se envía.
- **SbInput typing en Catalog search**: El usuario escribe en el campo de búsqueda (`Catalog.tsx`). El evento `input` se dispara dentro del Shadow DOM de `<sb-ui-input>`. No hay listener para `input` y los listeners de `change`/`sb-change` no capturan desde el Shadow DOM → `onChange` nunca se invoca → el filtro no se actualiza.
- **SbSelect change en Sandbox**: El usuario selecciona un método HTTP (`Sandbox.tsx`). El evento `change` se origina dentro del Shadow DOM de `<sb-ui-select>`. El listener sin `{ capture: true }` no lo captura → `onChange` nunca se invoca → el método no cambia.
- **SbTextarea typing en Sandbox body**: El usuario edita el body JSON (`Sandbox.tsx`). Mismo problema que SbInput — no hay listener `input` y los listeners existentes no capturan desde Shadow DOM → `onChange` nunca se invoca → el body no se actualiza.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Botones con `disabled={true}` deben seguir bloqueando clicks y llamando `e.preventDefault()` + `e.stopPropagation()`
- Botones con `loading={true}` deben seguir bloqueando clicks de la misma manera
- Botones con `type="submit"` dentro de un `<form>` deben seguir disparando el submit del formulario
- `onBlur` en `SbInput` y `SbSelect` debe seguir invocándose cuando el componente pierde foco
- Los atributos (`variant`, `size`, `disabled`, `error`, `errorMessage`, `placeholder`, etc.) deben seguir pasándose correctamente al custom element
- El valor controlado (`value` prop) debe seguir reflejándose en el Web Component
- `SbTabs` no se modifica — ya usa un `<button>` nativo con `onClick` de React como fallback
- `useImperativeHandle` en todos los wrappers debe seguir exponiendo `.value` y `.focus()`

**Scope:**
Todas las interacciones que NO involucren eventos del Shadow DOM o keystrokes en tiempo real deben ser completamente inalteradas por este fix. Esto incluye:
- Programmatic value updates via React props
- Blur events (ya funcionan porque `blur` no se origina en Shadow DOM de la misma manera)
- Attribute/prop forwarding al custom element
- Ref forwarding via `useImperativeHandle`

## Hypothesized Root Cause

Based on the code analysis of the 4 wrapper components, the root causes are:

1. **SbButton — Bubble-phase click listener**: `el.addEventListener('click', handleClick)` escucha en fase de burbujeo. Cuando `<sb-ui-button>` tiene Shadow DOM, el click en el `<button>` interno no burbujea al host element porque el Shadow DOM encapsula la propagación. El listener nunca se ejecuta.

2. **SbInput — Bubble-phase listeners + missing `input` event**: `el.addEventListener('sb-change', handleChange)` y `el.addEventListener('change', handleChange)` escuchan en burbujeo. Los eventos del Shadow DOM no llegan. Además, no hay listener para el evento `input`, que es el que se dispara en cada keystroke — `change` solo se dispara en blur/commit.

3. **SbSelect — Bubble-phase listeners**: `el.addEventListener('sb-change', handleChange)` y `el.addEventListener('change', handleChange)` escuchan en burbujeo. Los eventos de selección del Shadow DOM no llegan al host.

4. **SbTextarea — Identical to SbInput**: Usa `<sb-ui-input rows={N}>` internamente. Mismos listeners en burbujeo sin `{ capture: true }` y sin listener para `input`.

## Correctness Properties

Property 1: Bug Condition — Shadow DOM Events Are Captured

_For any_ user interaction where the event originates inside the Shadow DOM of a Bolívar UI custom element (`<sb-ui-button>`, `<sb-ui-input>`, `<sb-ui-select>`), the fixed wrapper component SHALL invoke the corresponding React callback (`onClick` for SbButton, `onChange` for SbInput/SbSelect/SbTextarea) with the correct value.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5**

Property 2: Bug Condition — Real-time Keystroke Updates

_For any_ keystroke event in `SbInput` or `SbTextarea`, the fixed wrapper SHALL invoke `onChange` on each keystroke (via the `input` event), updating React state in real-time rather than only on blur/commit.

**Validates: Requirements 2.3, 2.6**

Property 3: Preservation — Disabled/Loading Button Blocking

_For any_ click on an `SbButton` with `disabled={true}` or `loading={true}`, the fixed wrapper SHALL NOT invoke the `onClick` callback and SHALL call `e.preventDefault()` and `e.stopPropagation()`, preserving the existing guard behavior.

**Validates: Requirements 3.1, 3.2**

Property 4: Preservation — Non-Event Behaviors Unchanged

_For any_ interaction that does NOT involve Shadow DOM event capture (blur events, attribute forwarding, ref access, programmatic value updates), the fixed wrappers SHALL produce exactly the same behavior as the original wrappers.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `hackathon-kiro-grupo-A/packages/frontend/src/components/ui/SbButton.tsx`

**Function**: `useEffect` that registers the click listener

**Specific Changes**:
1. **Add capture phase to click listener**: Change `el.addEventListener('click', handleClick)` to `el.addEventListener('click', handleClick, { capture: true })` and update the corresponding `removeEventListener` to also use `{ capture: true }`.

---

**File**: `hackathon-kiro-grupo-A/packages/frontend/src/components/ui/SbInput.tsx`

**Function**: `useEffect` that registers change/blur listeners

**Specific Changes**:
1. **Add capture phase to existing listeners**: Add `{ capture: true }` as third argument to `addEventListener('sb-change', ...)` and `addEventListener('change', ...)`.
2. **Add `input` event listener**: Add `el.addEventListener('input', handleChange, { capture: true })` to capture real-time keystrokes from Shadow DOM.
3. **Update cleanup**: Add corresponding `removeEventListener('input', handleChange, { capture: true })` in the cleanup function.

---

**File**: `hackathon-kiro-grupo-A/packages/frontend/src/components/ui/SbSelect.tsx`

**Function**: `useEffect` that registers change/blur listeners

**Specific Changes**:
1. **Add capture phase to existing listeners**: Add `{ capture: true }` as third argument to `addEventListener('sb-change', ...)` and `addEventListener('change', ...)`.
2. **Update cleanup**: Update corresponding `removeEventListener` calls to include `{ capture: true }`.

---

**File**: `hackathon-kiro-grupo-A/packages/frontend/src/components/ui/SbTextarea.tsx`

**Function**: `useEffect` that registers change/blur listeners

**Specific Changes**:
1. **Add capture phase to existing listeners**: Add `{ capture: true }` as third argument to `addEventListener('sb-change', ...)` and `addEventListener('change', ...)`.
2. **Add `input` event listener**: Add `el.addEventListener('input', handleChange, { capture: true })` to capture real-time keystrokes from Shadow DOM.
3. **Update cleanup**: Add corresponding `removeEventListener('input', handleChange, { capture: true })` in the cleanup function.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that render each wrapper component, simulate user interactions (clicks, typing, selection changes), and assert that the corresponding callbacks are invoked. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **SbButton Click Test**: Render `SbButton` with an `onClick` spy, simulate a click event on the host element, assert the spy was called (will fail on unfixed code if Shadow DOM blocks it)
2. **SbInput Typing Test**: Render `SbInput` with an `onChange` spy, dispatch an `input` event on the host element, assert the spy was called with the typed value (will fail on unfixed code — no `input` listener)
3. **SbSelect Change Test**: Render `SbSelect` with an `onChange` spy, dispatch a `change` event on the host element, assert the spy was called with the selected value (will fail on unfixed code if Shadow DOM blocks it)
4. **SbTextarea Typing Test**: Render `SbTextarea` with an `onChange` spy, dispatch an `input` event on the host element, assert the spy was called (will fail on unfixed code — no `input` listener)

**Expected Counterexamples**:
- `onClick` / `onChange` callbacks are not invoked when events are dispatched
- Possible causes: bubble-phase listeners don't capture Shadow DOM events, missing `input` event listener

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL interaction WHERE isBugCondition(interaction) DO
  result := FixedWrapper(interaction)
  ASSERT result.callbackInvoked = true
  ASSERT result.callbackValue = interaction.expectedValue
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT isBugCondition(interaction) DO
  ASSERT OriginalWrapper(interaction) = FixedWrapper(interaction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for disabled buttons, blur events, and attribute forwarding, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Disabled Button Preservation**: Verify clicking a disabled SbButton does NOT invoke onClick — works on unfixed code, must continue after fix
2. **Loading Button Preservation**: Verify clicking a loading SbButton does NOT invoke onClick — works on unfixed code, must continue after fix
3. **Blur Event Preservation**: Verify SbInput and SbSelect onBlur callbacks continue to fire correctly after fix
4. **Attribute Forwarding Preservation**: Verify variant, size, disabled, error, placeholder props are correctly passed to the custom element after fix

### Unit Tests

- Test SbButton click invokes onClick callback (with capture phase)
- Test SbButton disabled/loading blocks onClick
- Test SbInput onChange fires on `input`, `change`, and `sb-change` events
- Test SbInput onBlur fires on blur event
- Test SbSelect onChange fires on `change` and `sb-change` events
- Test SbTextarea onChange fires on `input`, `change`, and `sb-change` events
- Test all wrappers pass attributes correctly to custom elements

### Property-Based Tests

- Generate random SbButton states (disabled: boolean, loading: boolean) and verify onClick is blocked when disabled OR loading, and invoked otherwise
- Generate random string values for SbInput and verify onChange receives the correct value on each keystroke
- Generate random option values for SbSelect and verify onChange receives the selected value

### Integration Tests

- Test Login form: type email + password → click submit → form submits
- Test Catalog page: type in search → results filter in real-time
- Test Sandbox page: select HTTP method → change is reflected, type body → body updates in real-time
- Test Register form: fill all fields including SbSelect → click submit → form submits
- Test ConsumerManagement: click action buttons (Aprobar, Suspender, Revocar) → modal opens
