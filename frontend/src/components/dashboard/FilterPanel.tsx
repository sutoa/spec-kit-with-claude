import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
  RefreshCw,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 9999,
      })
    }
  }, [])

  // Update position when dropdown opens and on scroll/resize
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition()
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true)
        window.removeEventListener('resize', updateDropdownPosition)
      }
    }
  }, [isDropdownOpen, updateDropdownPosition])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const allSelected =
    institutions.length > 0 && selectedInstitutionIds.length === institutions.length
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

  // Dropdown content to be rendered in portal
  const dropdownContent = isDropdownOpen ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className={cn(
        'w-64',
        'bg-obsidian-900 backdrop-blur-xl',
        'rounded-xl border border-obsidian-600',
        'shadow-2xl shadow-black/50',
        'animate-fade-in'
      )}
    >
      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-obsidian-700 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Filter Institutions
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-accent hover:text-accent-400 font-medium transition-colors"
          >
            All
          </button>
          <span className="text-obsidian-600">|</span>
          <button
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Institution List */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin py-2">
        {institutions.map((institution) => {
          const isSelected = selectedInstitutionIds.includes(institution.id)
          return (
            <button
              key={institution.id}
              onClick={() => handleToggle(institution.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5',
                'hover:bg-obsidian-700/50 transition-colors text-left'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center',
                  'transition-all duration-200',
                  isSelected
                    ? 'bg-accent border-accent text-obsidian-950'
                    : 'border-obsidian-500 bg-transparent'
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm text-foreground">{institution.name}</span>
            </button>
          )
        })}
      </div>

      {/* Footer with count */}
      {someSelected && (
        <div className="px-4 py-2.5 border-t border-obsidian-700 bg-obsidian-800/50 rounded-b-xl">
          <p className="text-xs text-muted-foreground">
            Showing {selectedInstitutionIds.length} of {institutions.length}
          </p>
        </div>
      )}
    </div>
  ) : null

  return (
    <div
      className={cn(
        'relative rounded-xl px-5 py-4',
        'bg-obsidian-900/60 backdrop-blur-xl',
        'border border-obsidian-700/50'
      )}
    >
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-obsidian-600/50 to-transparent" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side: Filters */}
        <div className="flex items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <label htmlFor="asOfDate" className="text-sm text-muted-foreground whitespace-nowrap">
                As of
              </label>
            </div>
            <div className="relative">
              <input
                type="date"
                id="asOfDate"
                value={asOfDate}
                onChange={(e) => onAsOfDateChange(e.target.value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium',
                  'bg-obsidian-800/50 border border-obsidian-700/50',
                  'text-foreground placeholder-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
                  'hover:bg-obsidian-700/50 transition-all duration-200',
                  'cursor-pointer'
                )}
              />
              {asOfDate && (
                <button
                  onClick={() => onAsOfDateChange('')}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2',
                    'p-1 rounded-md text-muted-foreground',
                    'hover:text-foreground hover:bg-obsidian-700/50',
                    'transition-colors'
                  )}
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Institution Filter Dropdown */}
          {institutions.length > 1 && onInstitutionFilterChange && (
            <>
              <div className="h-6 w-px bg-obsidian-700/50" />
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  'transition-all duration-200',
                  someSelected
                    ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/15'
                    : 'bg-obsidian-800/50 text-foreground border border-obsidian-700/50 hover:bg-obsidian-700/50'
                )}
              >
                <Filter className="w-4 h-4" />
                <span>{getFilterLabel()}</span>
                {isDropdownOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-obsidian-700/50 transition-all duration-200'
            )}
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-accent text-obsidian-950',
              'hover:bg-accent-400 transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-glow-sm hover:shadow-glow'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Render dropdown in portal to escape all overflow containers */}
      {createPortal(dropdownContent, document.body)}
    </div>
  )
}
