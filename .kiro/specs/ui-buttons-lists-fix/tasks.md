# Tasks

## Task 1: Fix SbButton — Add capture-phase click listener
- [x] 1.1 In `SbButton.tsx`, update `el.addEventListener('click', handleClick)` to `el.addEventListener('click', handleClick, { capture: true })`
- [x] 1.2 Update the cleanup `el.removeEventListener('click', handleClick)` to `el.removeEventListener('click', handleClick, { capture: true })`
- [x] 1.3 Verify that the disabled/loading guard logic (`e.preventDefault()` + `e.stopPropagation()`) still works correctly with capture phase

## Task 2: Fix SbInput — Add capture phase + input event listener
- [x] 2.1 In `SbInput.tsx`, add `{ capture: true }` to `el.addEventListener('sb-change', handleChange)` → `el.addEventListener('sb-change', handleChange, { capture: true })`
- [x] 2.2 Add `{ capture: true }` to `el.addEventListener('change', handleChange)` → `el.addEventListener('change', handleChange, { capture: true })`
- [x] 2.3 Add new listener: `el.addEventListener('input', handleChange, { capture: true })` for real-time keystroke capture
- [x] 2.4 Update cleanup to include `{ capture: true }` on all three `removeEventListener` calls and add `el.removeEventListener('input', handleChange, { capture: true })`

## Task 3: Fix SbSelect — Add capture phase to event listeners
- [x] 3.1 In `SbSelect.tsx`, add `{ capture: true }` to `el.addEventListener('sb-change', handleChange)` → `el.addEventListener('sb-change', handleChange, { capture: true })`
- [x] 3.2 Add `{ capture: true }` to `el.addEventListener('change', handleChange)` → `el.addEventListener('change', handleChange, { capture: true })`
- [x] 3.3 Update cleanup to include `{ capture: true }` on both `removeEventListener` calls

## Task 4: Fix SbTextarea — Add capture phase + input event listener
- [x] 4.1 In `SbTextarea.tsx`, add `{ capture: true }` to `el.addEventListener('sb-change', handleChange)` → `el.addEventListener('sb-change', handleChange, { capture: true })`
- [x] 4.2 Add `{ capture: true }` to `el.addEventListener('change', handleChange)` → `el.addEventListener('change', handleChange, { capture: true })`
- [x] 4.3 Add new listener: `el.addEventListener('input', handleChange, { capture: true })` for real-time keystroke capture
- [x] 4.4 Update cleanup to include `{ capture: true }` on all three `removeEventListener` calls and add `el.removeEventListener('input', handleChange, { capture: true })`

## Task 5: Write unit tests for fixed wrappers
- [x] 5.1 Create test file `SbButton.test.tsx` — test that onClick fires on click, test that disabled/loading blocks onClick
- [x] 5.2 Create test file `SbInput.test.tsx` — test that onChange fires on `input`, `change`, and `sb-change` events, test onBlur fires
- [x] 5.3 Create test file `SbSelect.test.tsx` — test that onChange fires on `change` and `sb-change` events, test onBlur fires
- [x] 5.4 Create test file `SbTextarea.test.tsx` — test that onChange fires on `input`, `change`, and `sb-change` events

## Task 6: Run build verification
- [x] 6.1 Run TypeScript compilation to verify no type errors were introduced
- [x] 6.2 Run the full test suite to verify all tests pass
