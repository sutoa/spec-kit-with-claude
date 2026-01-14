import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../services/api'
import type { InstitutionWithConnection, CredentialData } from '../types'

/**
 * Fetch all institutions with their connection status
 */
export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const response = await api.getInstitutions()
      return response.data
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
}

/**
 * Fetch a single institution by ID
 */
export function useInstitution(id: string) {
  return useQuery({
    queryKey: ['institutions', id],
    queryFn: () => api.getInstitution(id),
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Mutation to create a new connection
 */
export function useCreateConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      institutionId,
      credentials,
    }: {
      institutionId: string
      credentials: CredentialData
    }) => {
      return api.createConnection({ institutionId, credentials })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch institutions to update connection status
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      queryClient.invalidateQueries({ queryKey: ['institutions', variables.institutionId] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Mutation to delete a connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: number) => {
      return api.deleteConnection(connectionId)
    },
    onMutate: async (connectionId) => {
      // Optimistically update institutions list
      await queryClient.cancelQueries({ queryKey: ['institutions'] })

      const previousInstitutions = queryClient.getQueryData<InstitutionWithConnection[]>([
        'institutions',
      ])

      if (previousInstitutions) {
        queryClient.setQueryData<InstitutionWithConnection[]>(
          ['institutions'],
          previousInstitutions.map((inst) =>
            inst.connection?.id === connectionId ? { ...inst, connection: null } : inst
          )
        )
      }

      return { previousInstitutions }
    },
    onError: (_err, _connectionId, context) => {
      // Rollback on error
      if (context?.previousInstitutions) {
        queryClient.setQueryData(['institutions'], context.previousInstitutions)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Mutation to sync a connection
 */
export function useSyncConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: number) => {
      return api.syncConnection(connectionId)
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
