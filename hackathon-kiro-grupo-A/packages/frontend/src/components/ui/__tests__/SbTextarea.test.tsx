import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SbTextarea } from '../SbTextarea';

describe('SbTextarea', () => {
  it('invokes onChange when an input event is dispatched', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbTextarea onChange={handleChange} data-testid="ta" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    Object.defineProperty(host, 'value', {
      value: 'typing...',
      writable: true,
    });
    host.dispatchEvent(new Event('input', { bubbles: true }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('typing...');
  });

  it('invokes onChange when a change event is dispatched', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbTextarea onChange={handleChange} data-testid="ta" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    Object.defineProperty(host, 'value', {
      value: 'committed',
      writable: true,
    });
    host.dispatchEvent(new Event('change', { bubbles: true }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('committed');
  });

  it('invokes onChange when an sb-change CustomEvent is dispatched', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbTextarea onChange={handleChange} data-testid="ta" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    host.dispatchEvent(
      new CustomEvent('sb-change', {
        bubbles: true,
        detail: { value: 'custom-text' },
      }),
    );

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('custom-text');
  });

  it('passes the rows attribute to the custom element', () => {
    const { container } = render(
      <SbTextarea rows={5} data-testid="ta" />,
    );

    const host = container.querySelector('sb-ui-input')!;
    expect(host.getAttribute('rows')).toBe('5');
  });
});
