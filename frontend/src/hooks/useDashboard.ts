import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboard, refreshDashboard } from '../services/api'

export interface DashboardReport {
  asOfDate: string | null
  grandTotal: number
  totalInstitutions: number
  institutions: InstitutionSummary[]
}

export interface InstitutionSummary {
  institutionId: string
  institutionName: string
  subTotal: number
  accounts: AccountBalance[]
}

export interface AccountBalance {
  accountId: number
  accountName: string
  accountNumberMasked: string
  totalValue: number
  asOfDate: string
}

export interface RefreshResult {
  dashboard: DashboardReport
  syncResults: Array<{
    institutionId: string
    success: boolean
    error: string | null
  }>
}

export interface UseDashboardOptions {
  asOfDate?: string
  institutionIds?: string[]
}

export function useDashboard(options?: UseDashboardOptions) {
  const { asOfDate, institutionIds } = options || {}

  const query = useQuery({
    queryKey: ['dashboard', asOfDate, institutionIds],
    queryFn: async () => {
      const params: { asOfDate?: string; institutionIds?: string[] } = {}
      if (asOfDate) params.asOfDate = asOfDate
      if (institutionIds?.length) params.institutionIds = institutionIds
      return getDashboard(Object.keys(params).length > 0 ? params : undefined)
    },
  })

  return query
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      return refreshDashboard()
    },
    onSuccess: () => {
      // Invalidate dashboard query to refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return mutation
}

export function useExportDashboard() {
  const exportDashboard = async (asOfDate?: string) => {
    const params = new URLSearchParams()
    if (asOfDate) {
      params.append('asOfDate', asOfDate)
    }

    const response = await fetch(
      `http://localhost:3001/api/dashboard/export${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to export dashboard')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `account-report-${asOfDate || new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return { exportDashboard }
}
