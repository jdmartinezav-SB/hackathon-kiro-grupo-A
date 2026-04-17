import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
} from 'react';

export interface SbInputProps {
  type?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  name?: string;
  id?: string;
  autoComplete?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  'data-testid'?: string;
}

export const SbInput = forwardRef<HTMLElement, SbInputProps>(
  (
    {
      type,
      value,
      placeholder,
      disabled,
      error,
      errorMessage,
      label,
      name,
      id,
      autoComplete,
      onChange,
      onBlur,
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
          return (el as unknown as HTMLInputElement).value ?? '';
        },
        set value(v: string) {
          (el as unknown as HTMLInputElement).value = v;
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
          (e.target as HTMLInputElement)?.value ??
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

      el.addEventListener('sb-change', handleChange, { capture: true });
      el.addEventListener('change', handleChange, { capture: true });
      el.addEventListener('input', handleChange, { capture: true });
      el.addEventListener('blur', handleBlur);

      return () => {
        el.removeEventListener('sb-change', handleChange, { capture: true });
        el.removeEventListener('change', handleChange, { capture: true });
        el.removeEventListener('input', handleChange, { capture: true });
        el.removeEventListener('blur', handleBlur);
      };
    }, [handleChange, handleBlur]);

    return (
      <sb-ui-input
        ref={innerRef}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled || undefined}
        error={error || undefined}
        error-message={errorMessage}
        label={label}
        name={name}
        id={id}
        autoComplete={autoComplete}
        className={className}
        data-testid={dataTestId}
      />
    );
  },
);

SbInput.displayName = 'SbInput';
