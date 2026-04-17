# Bugfix Requirements Document

## Introduction

Los wrappers React para los Web Components de Bolívar UI Design System (`SbButton`, `SbInput`, `SbSelect`, `SbTextarea`) no propagan correctamente los eventos de interacción del usuario. Esto causa que botones, campos de texto, selectores y textareas no respondan a clicks, cambios de valor ni input en tiempo real a lo largo de todo el portal Conecta 2.0. El impacto es crítico: la mayoría de las acciones del usuario (navegación, filtrado, envío de formularios, ejecución de peticiones en sandbox) están rotas.

**Componentes afectados:**
- `SbButton` — onClick no se dispara desde el Shadow DOM del Web Component
- `SbInput` — onChange no captura eventos del Shadow DOM; no escucha evento `input` para actualizaciones en tiempo real
- `SbSelect` — onChange no captura eventos del Shadow DOM
- `SbTextarea` — onChange no captura eventos del Shadow DOM; no escucha evento `input` para actualizaciones en tiempo real

**Páginas afectadas:** Login, Register, Catalog, ApiDetail, ApiManagement, ConsumerManagement, Sandbox, Notifications (indirectamente vía SbTabs)

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks an `SbButton` component that wraps `<sb-ui-button>` with Shadow DOM THEN the system does not invoke the `onClick` callback because `addEventListener('click', ...)` on the host element does not capture clicks originating inside the Shadow DOM

1.2 WHEN a user types into an `SbInput` component that wraps `<sb-ui-input>` with Shadow DOM THEN the system does not invoke the `onChange` callback because the `sb-change` and `change` event listeners on the host element do not capture events emitted inside the Shadow DOM

1.3 WHEN a user types into an `SbInput` component THEN the system does not update the React state in real-time on each keystroke because the wrapper only listens for `sb-change` and `change` events (which fire on blur/commit) and does not listen for the `input` event

1.4 WHEN a user selects an option in an `SbSelect` component that wraps `<sb-ui-select>` with Shadow DOM THEN the system does not invoke the `onChange` callback because the `sb-change` and `change` event listeners on the host element do not capture events emitted inside the Shadow DOM

1.5 WHEN a user types into an `SbTextarea` component (which wraps `<sb-ui-input rows=N>`) with Shadow DOM THEN the system does not invoke the `onChange` callback because the `sb-change` and `change` event listeners on the host element do not capture events emitted inside the Shadow DOM

1.6 WHEN a user types into an `SbTextarea` component THEN the system does not update the React state in real-time on each keystroke because the wrapper only listens for `sb-change` and `change` events and does not listen for the `input` event

### Expected Behavior (Correct)

2.1 WHEN a user clicks an `SbButton` component that wraps `<sb-ui-button>` with Shadow DOM THEN the system SHALL invoke the `onClick` callback by using capture-phase event listening or a React-native click handler on a wrapper element to intercept clicks from within the Shadow DOM

2.2 WHEN a user types into an `SbInput` component that wraps `<sb-ui-input>` with Shadow DOM THEN the system SHALL invoke the `onChange` callback by listening for `sb-change`, `change`, and `input` events using capture phase (`{ capture: true }`) to intercept events from within the Shadow DOM

2.3 WHEN a user types into an `SbInput` component THEN the system SHALL update the React state in real-time on each keystroke by listening for the `input` event in addition to `sb-change` and `change`

2.4 WHEN a user selects an option in an `SbSelect` component that wraps `<sb-ui-select>` with Shadow DOM THEN the system SHALL invoke the `onChange` callback by listening for `sb-change` and `change` events using capture phase (`{ capture: true }`) to intercept events from within the Shadow DOM

2.5 WHEN a user types into an `SbTextarea` component with Shadow DOM THEN the system SHALL invoke the `onChange` callback by listening for `sb-change`, `change`, and `input` events using capture phase (`{ capture: true }`) to intercept events from within the Shadow DOM

2.6 WHEN a user types into an `SbTextarea` component THEN the system SHALL update the React state in real-time on each keystroke by listening for the `input` event in addition to `sb-change` and `change`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a disabled `SbButton` is clicked THEN the system SHALL CONTINUE TO prevent the `onClick` callback from being invoked and stop event propagation

3.2 WHEN a loading `SbButton` is clicked THEN the system SHALL CONTINUE TO prevent the `onClick` callback from being invoked and stop event propagation

3.3 WHEN an `SbButton` with `type="submit"` is inside a form THEN the system SHALL CONTINUE TO trigger form submission behavior

3.4 WHEN an `SbInput` loses focus THEN the system SHALL CONTINUE TO invoke the `onBlur` callback

3.5 WHEN an `SbSelect` loses focus THEN the system SHALL CONTINUE TO invoke the `onBlur` callback

3.6 WHEN an `SbInput` or `SbTextarea` receives a value prop update from React THEN the system SHALL CONTINUE TO reflect the controlled value on the Web Component

3.7 WHEN `SbButton`, `SbInput`, `SbSelect`, or `SbTextarea` are rendered with variant, size, disabled, error, and other attribute props THEN the system SHALL CONTINUE TO pass those attributes correctly to the underlying Web Component custom element

3.8 WHEN an `SbTabs` component tab button is clicked directly (via the React `onClick` handler on the `<button>`) THEN the system SHALL CONTINUE TO invoke the `onTabChange` callback correctly since SbTabs already uses a native React onClick fallback

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type UserInteraction
  OUTPUT: boolean

  // Returns true when the interaction targets a Bolívar UI Web Component
  // wrapper (SbButton, SbInput, SbSelect, SbTextarea) and the event
  // originates from within the Shadow DOM of the custom element
  RETURN X.targetComponent IN {SbButton, SbInput, SbSelect, SbTextarea}
    AND X.eventOrigin = "shadow-dom"
END FUNCTION
```

### Sub-condition for real-time input (Bugs 1.3, 1.6)

```pascal
FUNCTION isInputRealtimeBugCondition(X)
  INPUT: X of type UserInteraction
  OUTPUT: boolean

  // Returns true when the user is typing (keystroke) into SbInput or SbTextarea
  // and the wrapper only listens for change/sb-change (not input)
  RETURN X.targetComponent IN {SbInput, SbTextarea}
    AND X.eventType = "keystroke"
    AND X.expectedListenerEvent = "input"
END FUNCTION
```

### Property Specification — Fix Checking

```pascal
// Property: Fix Checking — Shadow DOM Event Propagation
FOR ALL X WHERE isBugCondition(X) DO
  result ← WrapperComponent'(X)
  ASSERT result.callbackInvoked = true
    AND result.callbackValue = X.expectedValue
END FOR

// Property: Fix Checking — Real-time Input Updates
FOR ALL X WHERE isInputRealtimeBugCondition(X) DO
  result ← WrapperComponent'(X)
  ASSERT result.onChangeInvokedPerKeystroke = true
    AND result.reactStateValue = X.currentInputValue
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) AND NOT isInputRealtimeBugCondition(X) DO
  ASSERT WrapperComponent(X) = WrapperComponent'(X)
END FOR
```

This ensures that for all non-buggy interactions (disabled buttons, blur events, attribute passing, SbTabs direct clicks, form submission), the fixed wrappers behave identically to the originals.
