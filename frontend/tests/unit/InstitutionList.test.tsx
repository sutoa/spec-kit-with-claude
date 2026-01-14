import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InstitutionList } from '../../src/components/connections/InstitutionList';

// Mock the InstitutionCard component
vi.mock('../../src/components/connections/InstitutionCard', () => ({
  InstitutionCard: ({ institution }: any) => (
    <div data-testid={`institution-card-${institution.id}`}>
      {institution.name}
    </div>
  ),
}));

describe('InstitutionList', () => {
  const mockInstitutions = [
    {
      id: 'alpaca',
      name: 'Alpaca',
      logoUrl: null,
      apiType: 'api' as const,
      apiBaseUrl: null,
      authType: 'api_key' as const,
      connection: {
        id: 1,
        institutionId: 'alpaca',
        status: 'connected' as const,
        lastSyncAt: new Date('2024-01-10T10:00:00Z'),
        errorMessage: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
      },
      lastUpdatedRelative: '2m ago',
    },
    {
      id: 'vanguard',
      name: 'Vanguard',
      logoUrl: null,
      apiType: 'manual' as const,
      apiBaseUrl: null,
      authType: 'credentials' as const,
      connection: null,
      lastUpdatedRelative: null,
    },
    {
      id: 'tdtrade',
      name: 'TD Trade',
      logoUrl: null,
      apiType: 'manual' as const,
      apiBaseUrl: null,
      authType: 'credentials' as const,
      connection: null,
      lastUpdatedRelative: null,
    },
  ];

  it('should render all institutions', () => {
    render(<InstitutionList institutions={mockInstitutions} />);

    expect(screen.getByTestId('institution-card-alpaca')).toBeInTheDocument();
    expect(screen.getByTestId('institution-card-vanguard')).toBeInTheDocument();
    expect(screen.getByTestId('institution-card-tdtrade')).toBeInTheDocument();
  });

  it('should render empty state when no institutions provided', () => {
    render(<InstitutionList institutions={[]} />);

    expect(
      screen.getByText(/no institutions available/i)
    ).toBeInTheDocument();
  });

  it('should filter institutions based on search query', () => {
    render(
      <InstitutionList institutions={mockInstitutions} searchQuery="alpaca" />
    );

    expect(screen.getByTestId('institution-card-alpaca')).toBeInTheDocument();
    expect(
      screen.queryByTestId('institution-card-vanguard')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('institution-card-tdtrade')
    ).not.toBeInTheDocument();
  });

  it('should render no results message when search yields no matches', () => {
    render(
      <InstitutionList
        institutions={mockInstitutions}
        searchQuery="nonexistent"
      />
    );

    expect(
      screen.getByText(/no institutions found matching/i)
    ).toBeInTheDocument();
  });

  it('should display institutions in a grid layout', () => {
    const { container } = render(
      <InstitutionList institutions={mockInstitutions} />
    );

    // Check that the container has grid layout classes
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should handle case-insensitive search', () => {
    render(
      <InstitutionList institutions={mockInstitutions} searchQuery="ALPACA" />
    );

    expect(screen.getByTestId('institution-card-alpaca')).toBeInTheDocument();
  });

  it('should filter institutions by partial name match', () => {
    render(
      <InstitutionList institutions={mockInstitutions} searchQuery="van" />
    );

    expect(screen.getByTestId('institution-card-vanguard')).toBeInTheDocument();
    expect(
      screen.queryByTestId('institution-card-alpaca')
    ).not.toBeInTheDocument();
  });

  it('should show all institutions when search query is empty', () => {
    render(<InstitutionList institutions={mockInstitutions} searchQuery="" />);

    expect(screen.getByTestId('institution-card-alpaca')).toBeInTheDocument();
    expect(screen.getByTestId('institution-card-vanguard')).toBeInTheDocument();
    expect(screen.getByTestId('institution-card-tdtrade')).toBeInTheDocument();
  });

  it('should render connected institutions before disconnected ones', () => {
    const { container } = render(
      <InstitutionList institutions={mockInstitutions} />
    );

    const cards = container.querySelectorAll('[data-testid^="institution-card-"]');
    const cardIds = Array.from(cards).map((card) =>
      card.getAttribute('data-testid')
    );

    // Alpaca (connected) should appear first
    expect(cardIds[0]).toBe('institution-card-alpaca');
  });
});
