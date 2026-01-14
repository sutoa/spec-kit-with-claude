import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../../src/components/layout/Header'

describe('Header', () => {
  it('renders the title', () => {
    render(<Header title="Consolidated Account Report" />)
    expect(screen.getByText('Consolidated Account Report')).toBeInTheDocument()
  })

  it('renders notification icon', () => {
    render(<Header title="Test" />)
    expect(screen.getByText('notifications')).toBeInTheDocument()
  })

  it('renders help icon', () => {
    render(<Header title="Test" />)
    expect(screen.getByText('help')).toBeInTheDocument()
  })

  it('renders user avatar', () => {
    render(<Header title="Test" />)
    expect(screen.getByRole('img', { name: /user avatar/i })).toBeInTheDocument()
  })

  it('renders children when provided', () => {
    render(
      <Header title="Test">
        <button>Export</button>
        <button>Refresh</button>
      </Header>
    )

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const { container } = render(<Header title="Test" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
