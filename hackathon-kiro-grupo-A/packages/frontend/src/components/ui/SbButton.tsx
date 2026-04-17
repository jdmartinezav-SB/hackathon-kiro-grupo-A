import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  type ReactNode,
} from 'react';

export interface SbButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
  styleType?: 'fill' | 'stroke' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: Event) => void;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const SbButton = forwardRef<HTMLElement, SbButtonProps>(
  (
    {
      variant,
      styleType,
      size,
      disabled,
      loading,
      type = 'button',
      onClick,
      children,
      className,
      'data-testid': dataTestId,
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    const handleClick = useCallback(
      (e: Event) => {
        if (disabled || loading) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e);
      },
      [disabled, loading, onClick],
    );

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      el.addEventListener('click', handleClick);
      return () => {
        el.removeEventListener('click', handleClick);
      };
    }, [handleClick]);

    return (
      <sb-ui-button
        ref={innerRef}
        variant={variant}
        style-type={styleType}
        size={size}
        disabled={disabled || undefined}
        loading={loading || undefined}
        type={type}
        className={className}
        data-testid={dataTestId}
      >
        {children}
      </sb-ui-button>
    );
  },
);

SbButton.displayName = 'SbButton';
