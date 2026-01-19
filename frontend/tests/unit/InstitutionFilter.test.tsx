import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InstitutionFilter } from '../../src/components/dashboard/InstitutionFilter'

describe('InstitutionFilter', () => {
  const mockInstitutions = [
    { id: 'vanguard', name: 'Vanguard' },
    { id: 'schwab', name: 'Schwab' },
    { id: 'alpaca-paper', name: 'Alpaca Paper' },
  ]

  it('renders all institutions as checkboxes', () => {
    render(
      <InstitutionFilter
        institutions={mockInstitutions}
        selectedIds={[]}
        onChange={() => {}}
      />
    )

    expect(screen.getByLabelText('Vanguard')).toBeInTheDocument()
    expect(screen.getByLabelText('Schwab')).toBeInTheDocument()
    expect(screen.getByLabelText('Alpaca Paper')).toBeInTheDocument()
  })

  it('shows checkboxes as checked when institution is selected', () => {
    render(
      <InstitutionFilter
        institutions={mockInstitutions}
        selectedIds={['vanguard', 'schwab']}
        onChange={() => {}}
      />
    )

    expect(screen.getByLabelText('Vanguard')).toBeChecked()
    expect(screen.getByLabelText('Schwab')).toBeChecked()
    expect(screen.getByLabelText('Alpaca Paper')).not.toBeChecked()
  })

  it('calls onChange when checkbox is clicked', () => {
    const handleChange = vi.fn()

    render(
      <InstitutionFilter
        institutions={mockInstitutions}
        selectedIds={['vanguard']}
        onChange={handleChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Schwab'))

    expect(handleChange).toHaveBeenCalledWith(['vanguard', 'schwab'])
  })

  it('removes institution from selection when unchecked', () => {
    const handleChange = vi.fn()

    render(
      <InstitutionFilter
        institutions={mockInstitutions}
        selectedIds={['vanguard', 'schwab']}
        onChange={handleChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Vanguard'))

    expect(handleChange).toHaveBeenCalledWith(['schwab'])
  })

  it('renders empty state when no institutions provided', () => {
    render(
      <InstitutionFilter
        institutions={[]}
        selectedIds={[]}
        onChange={() => {}}
      />
    )

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('shows "All" option that selects/deselects all institutions', () => {
    const handleChange = vi.fn()

    render(
      <InstitutionFilter
        institutions={mockInstitutions}
        selectedIds={[]}
        onChange={handleChange}
        showAllOption
      />
    )

    const allCheckbox = screen.getByLabelText('All Institutions')
    fireEvent.click(allCheckbox)

    expect(handleChange).toHaveBeenCalledWith(['vanguard', 'schwab', 'alpaca-paper'])
  })
})
