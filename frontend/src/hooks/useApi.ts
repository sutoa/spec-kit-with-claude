import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import * as api from '../services/api'
import type {
  InstitutionWithConnection,
  Connection,
  CreateConnectionRequest,
  SyncResult,
  RefreshResult,
} from '../types'

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  institutions: ['institutions'] as const,
  institution: (id: string) => ['institutions', id] as const,
  connections: ['connections'] as const,
  accounts: (params?: { connectionId?: number; institutionId?: string }) =>
    ['accounts', params] as const,
  dashboard: (params?: { asOfDate?: string; institutionIds?: string[] }) =>
    ['dashboard', params] as const,
}

// Health
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.getHealth,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Institutions
export function useInstitutions(
  options?: Omit<
    UseQueryOptions<{ data: InstitutionWithConnection[] }>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: queryKeys.institutions,
    queryFn: api.getInstitutions,
    ...options,
  })
}

export function useInstitution(id: string) {
  return useQuery({
    queryKey: queryKeys.institution(id),
    queryFn: () => api.getInstitution(id),
    enabled: !!id,
  })
}

// Connections
export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: api.getConnections,
  })
}

export function useCreateConnection(
  options?: UseMutationOptions<Connection, Error, CreateConnectionRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.institutions })
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    ...options,
  })
}

export function useDeleteConnection(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.institutions })
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    ...options,
  })
}

export function useSyncConnection(options?: UseMutationOptions<SyncResult, Error, number>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.syncConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    ...options,
  })
}

// Accounts
export function useAccounts(params?: { connectionId?: number; institutionId?: string }) {
  return useQuery({
    queryKey: queryKeys.accounts(params),
    queryFn: () => api.getAccounts(params),
  })
}

// Dashboard
export function useDashboard(params?: { asOfDate?: string; institutionIds?: string[] }) {
  return useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => api.getDashboard(params),
  })
}

export function useRefreshDashboard(options?: UseMutationOptions<RefreshResult, Error, void>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.refreshDashboard,
    onSuccess: (data) => {
      // Update dashboard cache with the new data
      queryClient.setQueryData(['dashboard', undefined], data.dashboard)
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    ...options,
  })
}

export function useExportDashboard() {
  return useMutation({
    mutationFn: (asOfDate?: string) => api.exportDashboard(asOfDate),
    onSuccess: (blob) => {
      // Trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}
