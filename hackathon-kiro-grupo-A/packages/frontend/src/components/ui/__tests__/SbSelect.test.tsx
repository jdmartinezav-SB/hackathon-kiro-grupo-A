import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SbSelect } from '../SbSelect';

describe('SbSelect', () => {
  it('invokes onChange when a change event fires on the native select', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SbSelect onChange={handleChange} data-testid="sel">
        <option value="a">A</option>
      </SbSelect>,
    );

    const select = container.querySelector('select')!;
    expect(select).not.toBeNull();

    fireEvent.change(select, { target: { value: 'a' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('invokes onBlur when the native select loses focus', () => {
    const handleBlur = vi.fn();
    const { container } = render(
      <SbSelect onBlur={handleBlur} data-testid="sel">
        <option value="x">X</option>
      </SbSelect>,
    );

    const select = container.querySelector('select')!;
    expect(select).not.toBeNull();

    fireEvent.blur(select);

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('passes className, disabled, and name to the native select', () => {
    const { container } = render(
      <SbSelect
        disabled
        name="my-select"
        className="custom-class"
        data-testid="sel"
      >
        <option value="1">One</option>
      </SbSelect>,
    );

    const select = container.querySelector('select')!;
    expect(select).not.toBeNull();
    expect(select.className).toContain('sb-ui-select');
    expect(select.className).toContain('custom-class');
    expect(select.disabled).toBe(true);
    expect(select.name).toBe('my-select');
  });

  it('renders label inside sb-ui-input-container when label prop is provided', () => {
    const { container } = render(
      <SbSelect label="Options" data-testid="sel">
        <option value="1">One</option>
      </SbSelect>,
    );

    const wrapper = container.querySelector('.sb-ui-input-container');
    expect(wrapper).not.toBeNull();

    const label = wrapper!.querySelector('.sb-ui-input-label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe('Options');

    const select = wrapper!.querySelector('select');
    expect(select).not.toBeNull();
  });

  it('renders error state and helper text when error and errorMessage props are provided', () => {
    const { container } = render(
      <SbSelect error errorMessage="Required" data-testid="sel">
        <option value="1">One</option>
      </SbSelect>,
    );

    const select = container.querySelector('select')!;
    expect(select).not.toBeNull();
    expect(select.className).toContain('sb-ui-select--error');

    const helper = container.querySelector('.sb-ui-input-helper');
    expect(helper).not.toBeNull();
    expect(helper!.textContent).toBe('Required');
  });
});
