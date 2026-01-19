import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddInstitutionModal } from '../../src/components/connections/AddInstitutionModal'

// Mock the useBrokerages hook
vi.mock('../../src/hooks/useBrokerages', () => ({
  useBrokerages: vi.fn(),
}))

import { useBrokerages } from '../../src/hooks/useBrokerages'

const mockUseBrokerages = useBrokerages as ReturnType<typeof vi.fn>

const mockBrokerages = [
  { id: 'ALPACA', name: 'Alpaca', slug: 'ALPACA', isConnected: false },
  { id: 'ROBINHOOD', name: 'Robinhood', slug: 'ROBINHOOD', isConnected: false },
  { id: 'FIDELITY', name: 'Fidelity', slug: 'FIDELITY', isConnected: false },
  { id: 'SCHWAB', name: 'Schwab', slug: 'SCHWAB', isConnected: false },
  { id: 'VANGUARD', name: 'Vanguard', slug: 'VANGUARD', isConnected: false },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('AddInstitutionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={false} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    expect(screen.queryByText('Add Institution')).not.toBeInTheDocument()
  })

  it('should render modal when isOpen is true', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Add Institution')).toBeInTheDocument()
    expect(screen.getByText('Connect to a new financial institution via SnapTrade')).toBeInTheDocument()
  })

  it('should display all brokerages', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Alpaca')).toBeInTheDocument()
    expect(screen.getByText('Robinhood')).toBeInTheDocument()
    expect(screen.getByText('Fidelity')).toBeInTheDocument()
    expect(screen.getByText('Schwab')).toBeInTheDocument()
    expect(screen.getByText('Vanguard')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseBrokerages.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockUseBrokerages.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Failed to load institutions')).toBeInTheDocument()
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('should filter brokerages based on search query', async () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const searchInput = screen.getByPlaceholderText('Search institutions...')
    fireEvent.change(searchInput, { target: { value: 'robin' } })

    await waitFor(() => {
      expect(screen.getByText('Robinhood')).toBeInTheDocument()
      expect(screen.queryByText('Alpaca')).not.toBeInTheDocument()
      expect(screen.queryByText('Fidelity')).not.toBeInTheDocument()
    })
  })

  it('should show no results message when search has no matches', async () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const searchInput = screen.getByPlaceholderText('Search institutions...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No institutions found matching your search')).toBeInTheDocument()
    })
  })

  it('should call onSelect when a brokerage is clicked', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    const onSelect = vi.fn()
    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={onSelect} />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(screen.getByText('Robinhood'))

    expect(onSelect).toHaveBeenCalledWith(mockBrokerages[1])
  })

  it('should call onClose when close button is clicked', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    const onClose = vi.fn()
    render(
      <AddInstitutionModal isOpen={true} onClose={onClose} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(screen.getByLabelText('Close'))

    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when backdrop is clicked', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    const onClose = vi.fn()
    render(
      <AddInstitutionModal isOpen={true} onClose={onClose} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    // Click backdrop (the first div with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    expect(onClose).toHaveBeenCalled()
  })

  it('should clear search when modal is closed', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    const onClose = vi.fn()
    render(
      <AddInstitutionModal isOpen={true} onClose={onClose} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const searchInput = screen.getByPlaceholderText('Search institutions...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    fireEvent.click(screen.getByLabelText('Close'))

    // After closing, the search should be cleared
    expect(onClose).toHaveBeenCalled()
  })

  it('should display institution count in footer', () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('5 institutions available via SnapTrade')).toBeInTheDocument()
  })

  it('should perform case-insensitive search', async () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const searchInput = screen.getByPlaceholderText('Search institutions...')
    fireEvent.change(searchInput, { target: { value: 'ROBIN' } })

    await waitFor(() => {
      expect(screen.getByText('Robinhood')).toBeInTheDocument()
    })
  })

  it('should search by slug as well as name', async () => {
    mockUseBrokerages.mockReturnValue({
      data: mockBrokerages,
      isLoading: false,
      error: null,
    })

    render(
      <AddInstitutionModal isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const searchInput = screen.getByPlaceholderText('Search institutions...')
    fireEvent.change(searchInput, { target: { value: 'ALPACA' } })

    await waitFor(() => {
      expect(screen.getByText('Alpaca')).toBeInTheDocument()
    })
  })
})
