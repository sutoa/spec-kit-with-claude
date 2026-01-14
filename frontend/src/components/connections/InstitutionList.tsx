import { useMemo } from 'react'
import type { InstitutionWithConnection } from '../../types'
import { InstitutionCard } from './InstitutionCard'

interface InstitutionListProps {
  institutions: InstitutionWithConnection[]
  searchQuery?: string
  onConnect?: (institution: InstitutionWithConnection) => void
  onDisconnect?: (connection: { id: number; institutionName: string }) => void
}

export function InstitutionList({
  institutions,
  searchQuery = '',
  onConnect,
  onDisconnect,
}: InstitutionListProps) {
  // Filter and sort institutions
  const filteredInstitutions = useMemo(() => {
    let filtered = institutions

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((inst) => inst.name.toLowerCase().includes(query))
    }

    // Sort: connected first, then by name
    return filtered.sort((a, b) => {
      const aConnected = a.connection?.status === 'connected' ? 1 : 0
      const bConnected = b.connection?.status === 'connected' ? 1 : 0

      if (aConnected !== bConnected) {
        return bConnected - aConnected // Connected first
      }

      return a.name.localeCompare(b.name) // Then alphabetically
    })
  }, [institutions, searchQuery])

  // Empty states
  if (institutions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-outlined text-text-secondary-dark text-6xl mb-4">
          account_balance
        </span>
        <h3 className="text-text-primary-dark text-xl font-semibold mb-2">
          No institutions available
        </h3>
        <p className="text-text-secondary-dark">
          There are no financial institutions configured yet.
        </p>
      </div>
    )
  }

  if (filteredInstitutions.length === 0 && searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-outlined text-text-secondary-dark text-6xl mb-4">
          search_off
        </span>
        <h3 className="text-text-primary-dark text-xl font-semibold mb-2">
          No institutions found matching "{searchQuery}"
        </h3>
        <p className="text-text-secondary-dark">
          Try adjusting your search query.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredInstitutions.map((institution) => (
        <InstitutionCard
          key={institution.id}
          institution={institution}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      ))}
    </div>
  )
}
