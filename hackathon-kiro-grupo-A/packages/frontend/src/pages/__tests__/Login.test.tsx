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

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ingresar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /regístrate/i })).toBeInTheDocument();
  });
});
