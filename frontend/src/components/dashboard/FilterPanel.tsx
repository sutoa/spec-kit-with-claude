import { useState, useRef, useEffect } from 'react'

interface Institution {
  id: string
  name: string
}

interface FilterPanelProps {
  asOfDate: string
  onAsOfDateChange: (date: string) => void
  onRefresh: () => void
  onExport: () => void
  isRefreshing: boolean
  institutions?: Institution[]
  selectedInstitutionIds?: string[]
  onInstitutionFilterChange?: (ids: string[]) => void
}

export function FilterPanel({
  asOfDate,
  onAsOfDateChange,
  onRefresh,
  onExport,
  isRefreshing,
  institutions = [],
  selectedInstitutionIds = [],
  onInstitutionFilterChange,
}: FilterPanelProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allSelected = institutions.length > 0 && selectedInstitutionIds.length === institutions.length
  const noneSelected = selectedInstitutionIds.length === 0
  const someSelected = !noneSelected && !allSelected

  const handleToggle = (id: string) => {
    if (!onInstitutionFilterChange) return
    if (selectedInstitutionIds.includes(id)) {
      onInstitutionFilterChange(selectedInstitutionIds.filter((sid) => sid !== id))
    } else {
      onInstitutionFilterChange([...selectedInstitutionIds, id])
    }
  }

  const handleSelectAll = () => {
    if (!onInstitutionFilterChange) return
    onInstitutionFilterChange(institutions.map((inst) => inst.id))
  }

  const handleClearAll = () => {
    if (!onInstitutionFilterChange) return
    onInstitutionFilterChange([])
  }

  const getFilterLabel = () => {
    if (noneSelected || allSelected) return 'All Institutions'
    if (selectedInstitutionIds.length === 1) {
      const inst = institutions.find((i) => i.id === selectedInstitutionIds[0])
      return inst?.name || '1 Institution'
    }
    return `${selectedInstitutionIds.length} Institutions`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side: Filters */}
        <div className="flex items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="asOfDate" className="text-sm text-gray-500 whitespace-nowrap">
              As of
            </label>
            <input
              type="date"
              id="asOfDate"
              value={asOfDate}
              onChange={(e) => onAsOfDateChange(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-100 transition-colors cursor-pointer"
            />
            {asOfDate && (
              <button
                onClick={() => onAsOfDateChange('')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear date filter"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Institution Filter Dropdown */}
          {institutions.length > 1 && onInstitutionFilterChange && (
            <>
              <div className="h-5 w-px bg-gray-200" />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors
                    ${someSelected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-base">
                    {someSelected ? 'filter_alt' : 'filter_list'}
                  </span>
                  <span>{getFilterLabel()}</span>
                  <span className="material-symbols-outlined text-base">
                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* Quick Actions */}
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Filter Institutions
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectAll}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={handleClearAll}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {/* Institution List */}
                    <div className="max-h-64 overflow-y-auto py-1">
                      {institutions.map((institution) => {
                        const isSelected = selectedInstitutionIds.includes(institution.id)
                        return (
                          <button
                            key={institution.id}
                            onClick={() => handleToggle(institution.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                          >
                            <span
                              className={`
                                w-4 h-4 rounded border flex items-center justify-center text-white transition-colors
                                ${isSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300 bg-white'
                                }
                              `}
                            >
                              {isSelected && (
                                <span className="material-symbols-outlined text-xs">check</span>
                              )}
                            </span>
                            <span className="text-sm text-gray-700">{institution.name}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Footer with count */}
                    {someSelected && (
                      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500">
                          Showing {selectedInstitutionIds.length} of {institutions.length}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
            title="Export to CSV"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
