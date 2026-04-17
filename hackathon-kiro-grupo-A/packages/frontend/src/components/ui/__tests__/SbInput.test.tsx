import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SbInput } from '../SbInput';

describe('SbInput', () => {
  it('invokes onChange when an input event is dispatched', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbInput onChange={handleChange} data-testid="inp" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    // Set value on the host element before dispatching
    Object.defineProperty(host, 'value', { value: 'hello', writable: true });
    host.dispatchEvent(new Event('input', { bubbles: true }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  it('invokes onChange when a change event is dispatched', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbInput onChange={handleChange} data-testid="inp" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    Object.defineProperty(host, 'value', { value: 'world', writable: true });
    host.dispatchEvent(new Event('change', { bubbles: true }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('world');
  });

  it('invokes onChange when an sb-change CustomEvent is dispatched', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbInput onChange={handleChange} data-testid="inp" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    host.dispatchEvent(
      new CustomEvent('sb-change', {
        bubbles: true,
        detail: { value: 'custom-val' },
      }),
    );

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('custom-val');
  });

  it('invokes onBlur when a blur event is dispatched', () => {
    const handleBlur = vi.fn();
    const { container } = render(
      <SbInput onBlur={handleBlur} data-testid="inp" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    host.dispatchEvent(new Event('blur'));

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('passes attributes correctly to the custom element', () => {
    const { container } = render(
      <SbInput
        placeholder="Enter text"
        disabled
        error
        label="Name"
        data-testid="inp"
      />,
    );

    const host = container.querySelector('sb-ui-input')!;
    expect(host.getAttribute('placeholder')).toBe('Enter text');
    expect(host.getAttribute('disabled')).not.toBeNull();
    expect(host.getAttribute('error')).not.toBeNull();
    expect(host.getAttribute('label')).toBe('Name');
  });
});
