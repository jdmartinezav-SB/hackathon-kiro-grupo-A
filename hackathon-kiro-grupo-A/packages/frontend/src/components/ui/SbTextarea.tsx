import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
} from 'react';

export interface SbTextareaProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wrapper React para el Custom Element `<sb-ui-input>` en modo textarea.
 *
 * Bolívar UI usa `<sb-ui-input>` con el atributo `rows` para renderizar
 * un campo multilínea, en lugar de un tag separado.
 */
export const SbTextarea = forwardRef<HTMLElement, SbTextareaProps>(
  (
    {
      value,
      placeholder,
      disabled,
      rows = 3,
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
          return (el as unknown as HTMLTextAreaElement).value ?? '';
        },
        set value(v: string) {
          (el as unknown as HTMLTextAreaElement).value = v;
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
          (e.target as HTMLTextAreaElement)?.value ??
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
      <sb-ui-input
        ref={innerRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled || undefined}
        rows={rows}
        className={className}
        data-testid={dataTestId}
      />
    );
  },
);

SbTextarea.displayName = 'SbTextarea';
