import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GrandTotal } from '../../src/components/dashboard/GrandTotal'

describe('GrandTotal', () => {
  it('renders the grand total formatted as currency', () => {
    render(<GrandTotal total={1234567.89} asOfDate={null} />)

    expect(screen.getByText('Grand Total')).toBeInTheDocument()
    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
  })

  it('renders zero total correctly', () => {
    render(<GrandTotal total={0} asOfDate={null} />)

    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('displays as-of date when provided', () => {
    render(<GrandTotal total={50000} asOfDate="2024-01-15" />)

    expect(screen.getByText('As of')).toBeInTheDocument()
    // Date formatting may vary by timezone, so check for the year and month
    expect(screen.getByText(/Jan \d+, 2024/)).toBeInTheDocument()
  })

  it('does not display as-of date when null', () => {
    render(<GrandTotal total={50000} asOfDate={null} />)

    expect(screen.queryByText('As of')).not.toBeInTheDocument()
  })

  it('formats large numbers with commas', () => {
    render(<GrandTotal total={1000000000.50} asOfDate={null} />)

    expect(screen.getByText('$1,000,000,000.50')).toBeInTheDocument()
  })

  it('formats small numbers with two decimal places', () => {
    render(<GrandTotal total={0.10} asOfDate={null} />)

    expect(screen.getByText('$0.10')).toBeInTheDocument()
  })
})
