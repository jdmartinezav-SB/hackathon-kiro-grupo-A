import {
  forwardRef,
  useRef,
  useImperativeHandle,
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

export const SbSelect = forwardRef<HTMLSelectElement, SbSelectProps>(
  (
    {
      value,
      placeholder: _placeholder,
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
    const innerRef = useRef<HTMLSelectElement>(null);

    useImperativeHandle(ref, () => innerRef.current as HTMLSelectElement);

    const selectClassName = [
      'sb-ui-select',
      error ? 'sb-ui-select--error' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const selectElement = (
      <select
        ref={innerRef}
        value={value}
        disabled={disabled}
        name={name}
        className={selectClassName}
        data-testid={dataTestId}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => onBlur?.()}
      >
        {children}
      </select>
    );

    if (label || errorMessage) {
      return (
        <div className="sb-ui-input-container">
          {label && <label className="sb-ui-input-label">{label}</label>}
          {selectElement}
          {errorMessage && (
            <span className="sb-ui-input-helper">{errorMessage}</span>
          )}
        </div>
      );
    }

    return selectElement;
  },
);

SbSelect.displayName = 'SbSelect';
