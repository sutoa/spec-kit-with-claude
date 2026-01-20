import { useMemo } from 'react'
import { Building2, SearchX } from 'lucide-react'
import type { InstitutionWithConnection } from '../../types'
import { InstitutionCard } from './InstitutionCard'
import { cn } from '../../lib/utils'

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
        <div
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
            'bg-obsidian-800/50 border border-obsidian-700/50'
          )}
        >
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-foreground text-xl font-semibold mb-2">No institutions available</h3>
        <p className="text-muted-foreground">
          There are no financial institutions configured yet.
        </p>
      </div>
    )
  }

  if (filteredInstitutions.length === 0 && searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
            'bg-obsidian-800/50 border border-obsidian-700/50'
          )}
        >
          <SearchX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-foreground text-xl font-semibold mb-2">
          No institutions found matching "{searchQuery}"
        </h3>
        <p className="text-muted-foreground">Try adjusting your search query.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredInstitutions.map((institution, index) => (
        <div
          key={institution.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <InstitutionCard
            institution={institution}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      ))}
    </div>
  )
}
