import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Sandbox from '../Sandbox';
import { TestWrapper } from '../../test/test-utils';

describe('Sandbox Page', () => {
  it('renders heading, API selector, execute button, and response placeholder', () => {
    render(
      <TestWrapper>
        <Sandbox />
      </TestWrapper>,
    );

    expect(
      screen.getByRole('heading', { name: /sandbox/i }),
    ).toBeInTheDocument();

    // After migration to Web Components, the label can't be associated
    // with the custom element in jsdom. Use data-testid instead.
    expect(screen.getByTestId('sandbox-api-select')).toBeInTheDocument();

    // The execute button is now an sb-ui-button; query by text content
    expect(screen.getByText(/ejecutar/i)).toBeInTheDocument();

    expect(
      screen.getByText(/ejecuta una petición para ver la respuesta/i),
    ).toBeInTheDocument();
  });
});
