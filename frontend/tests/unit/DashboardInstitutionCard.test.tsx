import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstitutionCard } from '../../src/components/dashboard/InstitutionCard'
import type { InstitutionSummary } from '../../src/hooks/useDashboard'

describe('InstitutionCard (Dashboard)', () => {
  const mockInstitution: InstitutionSummary = {
    institutionId: 'alpaca',
    institutionName: 'Alpaca',
    subTotal: 75000.50,
    accounts: [
      {
        accountId: 1,
        accountName: 'Brokerage Account',
        accountNumberMasked: '•••• 1234',
        totalValue: 50000.00,
        asOfDate: '2024-01-15',
      },
      {
        accountId: 2,
        accountName: 'IRA Account',
        accountNumberMasked: '•••• 5678',
        totalValue: 25000.50,
        asOfDate: '2024-01-15',
      },
    ],
  }

  it('renders institution name', () => {
    render(<InstitutionCard institution={mockInstitution} />)

    expect(screen.getByText('Alpaca')).toBeInTheDocument()
  })

  it('renders subtotal formatted as currency', () => {
    render(<InstitutionCard institution={mockInstitution} />)

    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('$75,000.50')).toBeInTheDocument()
  })

  it('renders all accounts', () => {
    render(<InstitutionCard institution={mockInstitution} />)

    expect(screen.getByText('Brokerage Account')).toBeInTheDocument()
    expect(screen.getByText('IRA Account')).toBeInTheDocument()
  })

  it('renders account masked numbers', () => {
    render(<InstitutionCard institution={mockInstitution} />)

    expect(screen.getByText('•••• 1234')).toBeInTheDocument()
    expect(screen.getByText('•••• 5678')).toBeInTheDocument()
  })

  it('renders account balances formatted as currency', () => {
    render(<InstitutionCard institution={mockInstitution} />)

    expect(screen.getByText('$50,000.00')).toBeInTheDocument()
    expect(screen.getByText('$25,000.50')).toBeInTheDocument()
  })

  it('renders message when no accounts have balance data', () => {
    const emptyInstitution: InstitutionSummary = {
      institutionId: 'vanguard',
      institutionName: 'Vanguard',
      subTotal: 0,
      accounts: [],
    }

    render(<InstitutionCard institution={emptyInstitution} />)

    expect(screen.getByText('No accounts with balance data')).toBeInTheDocument()
  })

  it('renders as-of dates for each account', () => {
    render(<InstitutionCard institution={mockInstitution} />)

    // Should show "as of" text for accounts (date may vary by timezone)
    const asOfTexts = screen.getAllByText(/as of Jan \d+, 2024/)
    expect(asOfTexts).toHaveLength(2)
  })

  it('handles single account correctly', () => {
    const singleAccountInstitution: InstitutionSummary = {
      institutionId: 'tdtrade',
      institutionName: 'TD Trade',
      subTotal: 10000.00,
      accounts: [
        {
          accountId: 3,
          accountName: 'Trading Account',
          accountNumberMasked: '•••• 9999',
          totalValue: 10000.00,
          asOfDate: '2024-01-10',
        },
      ],
    }

    render(<InstitutionCard institution={singleAccountInstitution} />)

    expect(screen.getByText('TD Trade')).toBeInTheDocument()
    expect(screen.getByText('Trading Account')).toBeInTheDocument()
    // Use getAllByText since subtotal and account value are the same
    const amounts = screen.getAllByText('$10,000.00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })
})
