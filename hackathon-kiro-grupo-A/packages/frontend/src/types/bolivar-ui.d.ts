/**
 * Declaraciones de tipos para los Web Components del Design System Bolívar UI.
 *
 * Permite que TypeScript reconozca los Custom Elements `sb-ui-*` como
 * elementos JSX válidos dentro de componentes React, evitando errores
 * de compilación al usarlos directamente en TSX.
 */

type SbBaseAttributes = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;

declare namespace JSX {
  interface IntrinsicElements {
    'sb-ui-button': SbBaseAttributes & {
      variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
      'style-type'?: 'fill' | 'stroke' | 'text';
      size?: 'small' | 'medium' | 'large';
      disabled?: boolean;
      loading?: boolean;
      type?: 'button' | 'submit' | 'reset';
    };

    'sb-ui-input': SbBaseAttributes & {
      type?: string;
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      error?: boolean;
      'error-message'?: string;
      label?: string;
      name?: string;
      id?: string;
      autoComplete?: string;
      rows?: number;
    };

    'sb-ui-select': SbBaseAttributes & {
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      error?: boolean;
      'error-message'?: string;
      label?: string;
      name?: string;
    };

    'sb-ui-table': SbBaseAttributes;

    'sb-ui-tabs': SbBaseAttributes & {
      'active-tab'?: string | number;
    };

    'sb-ui-modal': SbBaseAttributes & {
      open?: boolean;
      title?: string;
    };

    'sb-ui-alert': SbBaseAttributes & {
      variant?: 'info' | 'success' | 'warning' | 'error';
      closable?: boolean;
    };

    'sb-ui-spinner': SbBaseAttributes & {
      size?: 'small' | 'medium' | 'large';
    };

    'sb-ui-breadcrumb': SbBaseAttributes;
  }
}

/** Flag global que indica si la CDN de Bolívar UI cargó correctamente. */
interface Window {
  __SB_UI_LOADED__?: boolean;
}
