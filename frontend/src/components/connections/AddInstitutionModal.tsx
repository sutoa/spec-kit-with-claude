import { useState, useMemo } from 'react'
import { useBrokerages } from '../../hooks/useBrokerages'
import type { Brokerage } from '../../types'

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
    return brokerages.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.slug.toLowerCase().includes(query)
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-panel-dark border border-border-dark rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-dark">
          <div>
            <h2 className="text-text-primary-dark text-2xl font-semibold mb-1">
              Add Institution
            </h2>
            <p className="text-text-secondary-dark text-sm">
              Connect to a new financial institution via SnapTrade
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-input-bg-dark rounded-lg transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-text-secondary-dark">
              close
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-dark">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-dark">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institutions..."
              className="w-full pl-10 pr-4 py-3 bg-input-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                progress_activity
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-red-400 text-4xl mb-2">
                error
              </span>
              <p className="text-red-400">Failed to load institutions</p>
              <p className="text-text-secondary-dark text-sm mt-1">
                {error instanceof Error ? error.message : 'Please try again'}
              </p>
            </div>
          ) : filteredBrokerages.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-text-secondary-dark text-4xl mb-2">
                search_off
              </span>
              <p className="text-text-secondary-dark">
                {searchQuery ? 'No institutions found matching your search' : 'No institutions available to connect'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBrokerages.map((brokerage) => (
                <button
                  key={brokerage.id}
                  onClick={() => handleSelect(brokerage)}
                  className="w-full flex items-center gap-4 p-4 bg-input-bg-dark hover:bg-input-bg-dark/80 border border-input-border-dark hover:border-primary/50 rounded-lg transition-all group"
                >
                  {/* Icon placeholder */}
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      account_balance
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 text-left">
                    <p className="text-text-primary-dark font-medium group-hover:text-primary transition-colors">
                      {brokerage.name}
                    </p>
                  </div>

                  {/* Arrow */}
                  <span className="material-symbols-outlined text-text-secondary-dark group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-dark">
          <p className="text-text-secondary-dark text-xs text-center">
            {brokerages?.length || 0} institutions available via SnapTrade
          </p>
        </div>
      </div>
    </div>
  )
}
