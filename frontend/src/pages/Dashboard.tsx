import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { GrandTotal } from '../components/dashboard/GrandTotal'
import { TotalInstitutions } from '../components/dashboard/TotalInstitutions'
import { FilterPanel } from '../components/dashboard/FilterPanel'
import { InstitutionCard } from '../components/dashboard/InstitutionCard'
import { useDashboard, useRefreshDashboard, useExportDashboard } from '../hooks/useDashboard'

export function Dashboard() {
  const [asOfDate, setAsOfDate] = useState('')

  const { data: dashboard, isLoading, error } = useDashboard(asOfDate || undefined)
  const refreshMutation = useRefreshDashboard()
  const { exportDashboard } = useExportDashboard()

  const handleRefresh = () => {
    refreshMutation.mutate()
  }

  const handleExport = () => {
    exportDashboard(asOfDate || undefined)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Consolidated Account Report" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 animate-spin">
              refresh
            </span>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Consolidated Account Report" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <span className="material-symbols-outlined text-6xl">error</span>
            <p className="mt-4">Failed to load dashboard</p>
            <p className="text-sm text-gray-600 mt-2">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  // Check if there are no institutions connected
  const hasNoData = dashboard.totalInstitutions === 0

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Consolidated Account Report" />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filter Panel */}
          <FilterPanel
            asOfDate={asOfDate}
            onAsOfDateChange={setAsOfDate}
            onRefresh={handleRefresh}
            onExport={handleExport}
            isRefreshing={refreshMutation.isPending}
          />

          {hasNoData ? (
            /* No Data State */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-6xl mb-4">account_balance</span>
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  No Institutions Connected
                </h2>
                <p className="text-center max-w-md mb-6">
                  Connect your financial institutions to see your consolidated account report here.
                </p>
                <a
                  href="/connections"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Connect Institution
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GrandTotal total={dashboard.grandTotal} asOfDate={dashboard.asOfDate} />
                <TotalInstitutions count={dashboard.totalInstitutions} />
              </div>

              {/* Institution Cards */}
              <div className="space-y-4">
                {dashboard.institutions.map((institution) => (
                  <InstitutionCard
                    key={institution.institutionId}
                    institution={institution}
                  />
                ))}
              </div>

              {/* Sync Results (if refresh was just performed) */}
              {refreshMutation.isSuccess && refreshMutation.data.syncResults.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Sync Results</h3>
                  <div className="space-y-1">
                    {refreshMutation.data.syncResults.map((result) => (
                      <div
                        key={result.institutionId}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            result.success ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {result.success ? 'check_circle' : 'error'}
                        </span>
                        <span className="text-gray-700">
                          {result.institutionId}:{' '}
                          {result.success ? 'Synced successfully' : result.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
