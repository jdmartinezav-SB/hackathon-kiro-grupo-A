import '@testing-library/jest-dom/vitest';

/**
 * Stubs mínimos para los Web Components de Bolívar UI.
 *
 * jsdom no soporta Custom Elements de forma nativa, así que registramos
 * clases vacías para que los tests no fallen al encontrar tags `sb-ui-*`.
 */
const SB_ELEMENTS = [
  'sb-ui-button',
  'sb-ui-input',
  'sb-ui-select',
  'sb-ui-table',
  'sb-ui-tabs',
  'sb-ui-modal',
  'sb-ui-alert',
  'sb-ui-spinner',
  'sb-ui-breadcrumb',
] as const;

for (const tag of SB_ELEMENTS) {
  if (!customElements.get(tag)) {
    customElements.define(
      tag,
      class extends HTMLElement {
        connectedCallback() {
          /* stub — sin comportamiento */
        }
      },
    );
  }
}
