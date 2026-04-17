import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Catalog from '../Catalog';
import { TestWrapper } from '../../test/test-utils';

describe('Catalog Page', () => {
  it('renders heading, API cards, search input, and category filter', async () => {
    render(
      <TestWrapper>
        <Catalog />
      </TestWrapper>,
    );

    expect(
      screen.getByRole('heading', { name: /catálogo de apis/i }),
    ).toBeInTheDocument();

    // Wait for mock data to load via React Query
    expect(
      await screen.findByText(/cotización autos/i),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/buscar por nombre o descripción/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('combobox', { name: /filtrar por categoría/i }),
    ).toBeInTheDocument();
  });
});
