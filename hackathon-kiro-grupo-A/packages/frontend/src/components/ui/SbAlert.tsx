import { forwardRef, useRef, useImperativeHandle, type ReactNode } from 'react';

export interface SbAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  closable?: boolean;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-alert>`.
 */
export const SbAlert = forwardRef<HTMLElement, SbAlertProps>(
  (
    { variant, closable, children, className, 'data-testid': dataTestId },
    ref,
  ) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    return (
      <sb-ui-alert
        ref={innerRef}
        variant={variant}
        closable={closable || undefined}
        className={className}
        data-testid={dataTestId}
      >
        {children}
      </sb-ui-alert>
    );
  },
);

SbAlert.displayName = 'SbAlert';
