import { useState, useMemo } from 'react'
import { X, Search, Building2, SearchX, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { useBrokerages } from '../../hooks/useBrokerages'
import type { Brokerage } from '../../types'
import { cn } from '../../lib/utils'

interface AddInstitutionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (brokerage: Brokerage) => void
}

export function AddInstitutionModal({ isOpen, onClose, onSelect }: AddInstitutionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: brokerages, isLoading, error } = useBrokerages({ showConnected: false })

  const filteredBrokerages = useMemo(() => {
    if (!brokerages) return []
    if (!searchQuery.trim()) return brokerages

    const query = searchQuery.toLowerCase()
    return brokerages.filter(
      (b) => b.name.toLowerCase().includes(query) || b.slug.toLowerCase().includes(query)
    )
  }, [brokerages, searchQuery])

  const handleClose = () => {
    setSearchQuery('')
    onClose()
  }

  const handleSelect = (brokerage: Brokerage) => {
    setSearchQuery('')
    onSelect(brokerage)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative max-w-lg w-full max-h-[80vh] flex flex-col',
          'bg-obsidian-900 border border-obsidian-700/50 rounded-2xl',
          'shadow-glass overflow-hidden animate-scale-in'
        )}
      >
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-obsidian-700/50">
          <div>
            <h2 className="text-foreground text-xl font-semibold mb-1">Add Institution</h2>
            <p className="text-muted-foreground text-sm">
              Connect to a new financial institution via SnapTrade
            </p>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-obsidian-700/50'
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-obsidian-700/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institutions..."
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl',
                'bg-obsidian-800/50 border border-obsidian-700/50',
                'text-foreground placeholder-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
                'transition-all duration-200'
              )}
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
              <p className="text-error font-medium">Failed to load institutions</p>
              <p className="text-muted-foreground text-sm mt-1">
                {error instanceof Error ? error.message : 'Please try again'}
              </p>
            </div>
          ) : filteredBrokerages.length === 0 ? (
            <div className="text-center py-12">
              <SearchX className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No institutions found matching your search'
                  : 'No institutions available to connect'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBrokerages.map((brokerage, index) => (
                <button
                  key={brokerage.id}
                  onClick={() => handleSelect(brokerage)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl',
                    'bg-obsidian-800/30 border border-obsidian-700/30',
                    'hover:bg-obsidian-700/50 hover:border-accent/30',
                    'transition-all duration-200 group',
                    'animate-fade-in-up'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      'bg-accent/10 border border-accent/20',
                      'group-hover:bg-accent/15 transition-colors'
                    )}
                  >
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>

                  {/* Name */}
                  <div className="flex-1 text-left">
                    <p className="text-foreground font-medium group-hover:text-accent transition-colors">
                      {brokerage.name}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-obsidian-700/50 bg-obsidian-900/50">
          <p className="text-muted-foreground text-xs text-center">
            {brokerages?.length || 0} institutions available via SnapTrade
          </p>
        </div>
      </div>
    </div>
  )
}
