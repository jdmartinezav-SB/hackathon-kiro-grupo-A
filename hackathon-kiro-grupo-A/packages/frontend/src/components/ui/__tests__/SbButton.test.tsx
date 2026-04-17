import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SbButton } from '../SbButton';

describe('SbButton', () => {
  it('invokes onClick when a click event is dispatched on the host element', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <SbButton onClick={handleClick} data-testid="btn">
        Click me
      </SbButton>,
    );

    const host = container.querySelector('sb-ui-button')!;
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke onClick when disabled is true', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <SbButton onClick={handleClick} disabled>
        Disabled
      </SbButton>,
    );

    const host = container.querySelector('sb-ui-button')!;
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does NOT invoke onClick when loading is true', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <SbButton onClick={handleClick} loading>
        Loading
      </SbButton>,
    );

    const host = container.querySelector('sb-ui-button')!;
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('passes variant, size, and type attributes to the custom element', () => {
    const { container } = render(
      <SbButton variant="primary" size="large" type="submit">
        Submit
      </SbButton>,
    );

    const host = container.querySelector('sb-ui-button')!;
    expect(host.getAttribute('variant')).toBe('primary');
    expect(host.getAttribute('size')).toBe('large');
    expect(host.getAttribute('type')).toBe('submit');
  });
});
