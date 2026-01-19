import { InstitutionFilter } from './InstitutionFilter'

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
  return (
    <div className="bg-panel-dark rounded-xl border border-border-dark p-4">
      <div className="flex items-start gap-6 flex-wrap">
        {/* Date Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="asOfDate" className="text-sm font-medium text-text-secondary-dark">
            As of Date
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              id="asOfDate"
              value={asOfDate}
              onChange={(e) => onAsOfDateChange(e.target.value)}
              className="px-3 py-2 bg-input-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {asOfDate && (
              <button
                onClick={() => onAsOfDateChange('')}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Institution Filter */}
        {institutions.length > 0 && onInstitutionFilterChange && (
          <div className="border-l border-border-dark pl-6">
            <InstitutionFilter
              institutions={institutions}
              selectedIds={selectedInstitutionIds}
              onChange={onInstitutionFilterChange}
              showAllOption
            />
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-input-bg-dark hover:bg-input-bg-dark/80 border border-border-dark rounded-lg text-text-primary-dark text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  )
}
