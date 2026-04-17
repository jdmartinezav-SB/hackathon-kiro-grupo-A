import { forwardRef, useRef, useImperativeHandle, type ReactNode } from 'react';

export interface SbBreadcrumbProps {
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-breadcrumb>`.
 *
 * Acepta children para los items de navegación jerárquica.
 */
export const SbBreadcrumb = forwardRef<HTMLElement, SbBreadcrumbProps>(
  ({ children, className, 'data-testid': dataTestId }, ref) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    return (
      <sb-ui-breadcrumb
        ref={innerRef}
        className={className}
        data-testid={dataTestId}
      >
        {children}
      </sb-ui-breadcrumb>
    );
  },
);

SbBreadcrumb.displayName = 'SbBreadcrumb';
