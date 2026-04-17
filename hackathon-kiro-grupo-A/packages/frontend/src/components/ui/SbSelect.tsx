import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  type ReactNode,
} from 'react';

export interface SbSelectProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  name?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const SbSelect = forwardRef<HTMLElement, SbSelectProps>(
  (
    {
      value,
      placeholder,
      disabled,
      error,
      errorMessage,
      label,
      name,
      onChange,
      onBlur,
      children,
      className,
      'data-testid': dataTestId,
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => {
      const el = innerRef.current!;
      return Object.assign(el, {
        get value() {
          return (el as unknown as HTMLSelectElement).value ?? '';
        },
        set value(v: string) {
          (el as unknown as HTMLSelectElement).value = v;
        },
        focus() {
          el.focus();
        },
      });
    });

    const handleChange = useCallback(
      (e: Event) => {
        const val =
          (e as CustomEvent).detail?.value ??
          (e.target as HTMLSelectElement)?.value ??
          '';
        onChange?.(val);
      },
      [onChange],
    );

    const handleBlur = useCallback(() => {
      onBlur?.();
    }, [onBlur]);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      el.addEventListener('sb-change', handleChange);
      el.addEventListener('change', handleChange);
      el.addEventListener('blur', handleBlur);

      return () => {
        el.removeEventListener('sb-change', handleChange);
        el.removeEventListener('change', handleChange);
        el.removeEventListener('blur', handleBlur);
      };
    }, [handleChange, handleBlur]);

    return (
      <sb-ui-select
        ref={innerRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled || undefined}
        error={error || undefined}
        error-message={errorMessage}
        label={label}
        name={name}
        className={className}
        data-testid={dataTestId}
      >
        {children}
      </sb-ui-select>
    );
  },
);

SbSelect.displayName = 'SbSelect';
