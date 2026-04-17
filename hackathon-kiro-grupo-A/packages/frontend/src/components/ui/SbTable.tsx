import { forwardRef, useRef, useImperativeHandle, type ReactNode } from 'react';

export interface SbTableProps {
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-table>`.
 *
 * Acepta children directos para columnas y filas, delegando la
 * estructura tabular al Web Component de Bolívar UI.
 */
export const SbTable = forwardRef<HTMLElement, SbTableProps>(
  ({ children, className, 'data-testid': dataTestId }, ref) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    return (
      <sb-ui-table
        ref={innerRef}
        className={className}
        data-testid={dataTestId}
      >
        {children}
      </sb-ui-table>
    );
  },
);

SbTable.displayName = 'SbTable';
