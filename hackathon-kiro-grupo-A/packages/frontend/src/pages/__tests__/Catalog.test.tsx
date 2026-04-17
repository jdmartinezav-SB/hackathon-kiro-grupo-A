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

    // After migration to Web Components, <sb-ui-input> and <sb-ui-select>
    // don't expose native roles (textbox, combobox) in jsdom.
    // Use data-testid to locate the custom element wrappers.
    expect(screen.getByTestId('catalog-search')).toBeInTheDocument();
    expect(screen.getByTestId('catalog-category-filter')).toBeInTheDocument();
  });
});
