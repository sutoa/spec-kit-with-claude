import { useState, useMemo, useEffect } from 'react'
import { Building2, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { GrandTotal } from '../components/dashboard/GrandTotal'
import { TotalInstitutions } from '../components/dashboard/TotalInstitutions'
import { FilterPanel } from '../components/dashboard/FilterPanel'
import { InstitutionCard } from '../components/dashboard/InstitutionCard'
import { useDashboard, useRefreshDashboard, useExportDashboard } from '../hooks/useDashboard'
import { cn } from '../lib/utils'

export function Dashboard() {
  const [asOfDate, setAsOfDate] = useState('')
  const [selectedInstitutionIds, setSelectedInstitutionIds] = useState<string[] | null>(null)

  // Get all unique institutions for filter dropdown (fetch without filter to get full list)
  const { data: fullDashboard } = useDashboard({
    asOfDate: asOfDate || undefined,
  })

  // Extract unique institutions for the filter
  const availableInstitutions = useMemo(() => {
    if (!fullDashboard?.institutions) return []
    return fullDashboard.institutions.map((inst) => ({
      id: inst.institutionId,
      name: inst.institutionName,
    }))
  }, [fullDashboard])

  // Initialize selectedInstitutionIds with all institutions when data first loads
  useEffect(() => {
    if (availableInstitutions.length > 0 && selectedInstitutionIds === null) {
      setSelectedInstitutionIds(availableInstitutions.map((inst) => inst.id))
    }
  }, [availableInstitutions, selectedInstitutionIds])

  // Fetch dashboard data with filters
  // When all are selected, pass undefined (no filter). When some are selected, pass the IDs.
  const effectiveFilter = useMemo(() => {
    if (selectedInstitutionIds === null) return undefined
    if (selectedInstitutionIds.length === availableInstitutions.length) return undefined
    return selectedInstitutionIds.length > 0 ? selectedInstitutionIds : []
  }, [selectedInstitutionIds, availableInstitutions.length])

  const { data: dashboard, isLoading, error } = useDashboard({
    asOfDate: asOfDate || undefined,
    institutionIds: effectiveFilter,
  })
  const refreshMutation = useRefreshDashboard()
  const { exportDashboard } = useExportDashboard()

  // Check if user explicitly filtered out all institutions
  const allFilteredOut =
    selectedInstitutionIds !== null &&
    selectedInstitutionIds.length === 0 &&
    availableInstitutions.length > 0

  // Filter institutions based on selection (client-side filter for when API doesn't filter)
  const filteredInstitutions = useMemo(() => {
    if (!dashboard?.institutions) return []
    if (selectedInstitutionIds === null || selectedInstitutionIds.length === availableInstitutions.length) {
      return dashboard.institutions
    }
    return dashboard.institutions.filter((inst) =>
      selectedInstitutionIds.includes(inst.institutionId)
    )
  }, [dashboard?.institutions, selectedInstitutionIds, availableInstitutions.length])

  // Recalculate totals based on filtered institutions
  const filteredGrandTotal = useMemo(() => {
    return filteredInstitutions.reduce((sum, inst) => sum + inst.subTotal, 0)
  }, [filteredInstitutions])

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
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading dashboard...</p>
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
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-error mx-auto" />
            <p className="text-foreground font-medium">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
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
    <div className="flex flex-col h-full">
      <Header title="Consolidated Account Report" />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filter Panel */}
          <FilterPanel
            asOfDate={asOfDate}
            onAsOfDateChange={setAsOfDate}
            onRefresh={handleRefresh}
            onExport={handleExport}
            isRefreshing={refreshMutation.isPending}
            institutions={availableInstitutions}
            selectedInstitutionIds={selectedInstitutionIds ?? undefined}
            onInstitutionFilterChange={setSelectedInstitutionIds}
          />

          {allFilteredOut ? (
            /* All institutions filtered out */
            <div
              className={cn(
                'relative overflow-hidden rounded-xl p-12',
                'bg-gradient-to-br from-obsidian-850 to-obsidian-900',
                'border border-obsidian-700/50'
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-obsidian-600/50 to-transparent" />

              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-16 h-16 rounded-2xl',
                    'bg-obsidian-800/50 border border-obsidian-700/50'
                  )}
                >
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    No Institutions Selected
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Select at least one institution from the filter to view your account report.
                  </p>
                </div>
              </div>
            </div>
          ) : hasNoData ? (
            /* No Data State */
            <div
              className={cn(
                'relative overflow-hidden rounded-xl p-12',
                'bg-gradient-to-br from-obsidian-850 to-obsidian-900',
                'border border-obsidian-700/50'
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-obsidian-600/50 to-transparent" />

              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div
                  className={cn(
                    'flex items-center justify-center w-16 h-16 rounded-2xl',
                    'bg-obsidian-800/50 border border-obsidian-700/50'
                  )}
                >
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    No Institutions Connected
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Connect your financial institutions to see your consolidated account report
                    here.
                  </p>
                </div>

                <a
                  href="/connections"
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium',
                    'bg-accent text-obsidian-950',
                    'hover:bg-accent-400 transition-colors duration-200',
                    'shadow-glow-sm hover:shadow-glow'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  Connect Institution
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <GrandTotal total={filteredGrandTotal} asOfDate={dashboard.asOfDate} />
                <TotalInstitutions count={filteredInstitutions.length} />
              </div>

              {/* Institution Cards */}
              <div className="space-y-4">
                {filteredInstitutions.map((institution, index) => (
                  <div
                    key={institution.institutionId}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <InstitutionCard institution={institution} />
                  </div>
                ))}
              </div>

              {/* Sync Results (if refresh was just performed) */}
              {refreshMutation.isSuccess && refreshMutation.data.syncResults.length > 0 && (
                <div
                  className={cn(
                    'rounded-xl p-4',
                    'bg-accent/5 border border-accent/20'
                  )}
                >
                  <h3 className="text-sm font-medium text-accent mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sync Results
                  </h3>
                  <div className="space-y-2">
                    {refreshMutation.data.syncResults.map((result) => (
                      <div
                        key={result.institutionId}
                        className="flex items-center gap-3 text-sm"
                      >
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-error" />
                        )}
                        <span className="text-foreground">
                          {result.institutionId}:{' '}
                          <span className="text-muted-foreground">
                            {result.success ? 'Synced successfully' : result.error}
                          </span>
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
