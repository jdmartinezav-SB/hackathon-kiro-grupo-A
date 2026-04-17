# Bugfix Requirements Document

## Introduction

The `SbSelect` React wrapper component renders a `<sb-ui-select>` custom element (Web Component) and passes native `<option>` elements as React children. However, the Bolívar UI Design System documentation specifies that the select component should be a **native `<select>` element** with the CSS class `sb-ui-select`, not a custom element tag. Because `<sb-ui-select>` is not a native `<select>`, the browser does not recognize the `<option>` children as dropdown items, causing the select to appear broken — options show as plain text or are not visible at all.

This bug affects every page that uses `SbSelect` with `<option>` children, including the Catalog page (category and status filters) and the Sandbox page (API, version, and HTTP method selectors).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `SbSelect` renders with `<option>` children THEN the system outputs a `<sb-ui-select>` custom element tag instead of a native `<select>` element, causing the browser to not recognize the `<option>` children as dropdown items

1.2 WHEN a user clicks on the `SbSelect` component on the Catalog page (category filter, status filter) or Sandbox page (API selector, method selector) THEN the system does not display a proper native dropdown list — options appear as plain text or are not visible

1.3 WHEN `SbSelect` listens for value changes via `sb-change` or `change` events on the `<sb-ui-select>` custom element THEN the system may not fire these events correctly because the custom element has no internal `<select>` to produce native `change` events from user interaction

### Expected Behavior (Correct)

2.1 WHEN `SbSelect` renders with `<option>` children THEN the system SHALL output a native `<select>` element with the CSS class `sb-ui-select` and render all `<option>` children inside it as a proper dropdown list, following the Design System specification

2.2 WHEN a user clicks on the `SbSelect` component on any page THEN the system SHALL display a fully functional native dropdown list with all options visible and selectable, styled according to the Bolívar UI Design System

2.3 WHEN a user selects an option from the `SbSelect` dropdown THEN the system SHALL fire the `onChange` callback with the selected value, using the native `change` event from the `<select>` element

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `SbSelect` receives `value`, `disabled`, `name`, `className`, or `data-testid` props THEN the system SHALL CONTINUE TO pass these attributes to the rendered select element

3.2 WHEN `SbSelect` receives `onBlur` callback THEN the system SHALL CONTINUE TO invoke it when the select element loses focus

3.3 WHEN `SbSelect` is used with a `ref` via `forwardRef` THEN the system SHALL CONTINUE TO expose the underlying DOM element through the ref, supporting `.value`, `.focus()`, and imperative access

3.4 WHEN `SbSelect` is used in Catalog.tsx with category and status filter options THEN the system SHALL CONTINUE TO filter the API list correctly based on the selected option value

3.5 WHEN `SbSelect` is used in Sandbox.tsx with API, version, and HTTP method options THEN the system SHALL CONTINUE TO update the request configuration correctly based on the selected option value

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type SbSelectRenderInput
  OUTPUT: boolean

  // The bug triggers whenever SbSelect renders with option children,
  // because it always outputs <sb-ui-select> instead of <select class="sb-ui-select">
  RETURN X.children CONTAINS one or more <option> elements
END FUNCTION
```

### Fix Checking Property

```pascal
// Property: Fix Checking — Native select rendering
FOR ALL X WHERE isBugCondition(X) DO
  result ← SbSelect'(X)
  ASSERT result.rootElement.tagName = "SELECT"
  ASSERT result.rootElement.classList.contains("sb-ui-select")
  ASSERT result.optionElements.length = count(X.children WHERE child.tagName = "option")
  ASSERT result.dropdown IS functional AND selectable
END FOR
```

### Preservation Checking Property

```pascal
// Property: Preservation Checking — Props and callbacks unchanged
FOR ALL X WHERE NOT isBugCondition(X) OR isBugCondition(X) DO
  ASSERT SbSelect(X).props = SbSelect'(X).props
  // value, disabled, name, className, data-testid, onBlur, ref behavior preserved
END FOR
```
