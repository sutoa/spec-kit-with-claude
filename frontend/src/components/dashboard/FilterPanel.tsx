interface FilterPanelProps {
  asOfDate: string
  onAsOfDateChange: (date: string) => void
  onRefresh: () => void
  onExport: () => void
  isRefreshing: boolean
}

export function FilterPanel({
  asOfDate,
  onAsOfDateChange,
  onRefresh,
  onExport,
  isRefreshing,
}: FilterPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="asOfDate" className="text-sm font-medium text-gray-700">
            As of Date:
          </label>
          <input
            type="date"
            id="asOfDate"
            value={asOfDate}
            onChange={(e) => onAsOfDateChange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>

        <button
          onClick={() => onAsOfDateChange('')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear Date
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  )
}
