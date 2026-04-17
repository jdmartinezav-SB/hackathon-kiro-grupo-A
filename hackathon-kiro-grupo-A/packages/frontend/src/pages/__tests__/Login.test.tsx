import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Login from '../Login';
import { TestWrapper } from '../../test/test-utils';

describe('Login Page', () => {
  it('renders the login form with email, password, submit button, and register link', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>,
    );

    // After migration to Web Components, jsdom doesn't associate the
    // `label` attribute of <sb-ui-input> like a native <label>+<input>.
    // Use data-testid to locate the custom element inputs.
    expect(screen.getByTestId('login-email')).toBeInTheDocument();
    expect(screen.getByTestId('login-password')).toBeInTheDocument();

    // The submit button is now an <sb-ui-button>; query by text content
    // since jsdom doesn't expose role="button" for custom elements.
    expect(screen.getByText(/ingresar/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /regístrate/i })).toBeInTheDocument();
  });
});
