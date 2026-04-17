import { forwardRef, useRef, useImperativeHandle } from 'react';

export interface SbSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-spinner>`.
 */
export const SbSpinner = forwardRef<HTMLElement, SbSpinnerProps>(
  ({ size, className, 'data-testid': dataTestId }, ref) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    return (
      <sb-ui-spinner
        ref={innerRef}
        size={size}
        className={className}
        data-testid={dataTestId}
      />
    );
  },
);

SbSpinner.displayName = 'SbSpinner';
