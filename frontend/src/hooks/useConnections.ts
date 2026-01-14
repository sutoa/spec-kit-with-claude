import { useQuery } from '@tanstack/react-query'
import * as api from '../services/api'

/**
 * Fetch all connections
 */
export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const response = await api.getConnections()
      return response.data
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
}

/**
 * Fetch a single connection by ID with details
 */
export function useConnection(id: number | null) {
  return useQuery({
    queryKey: ['connections', id],
    queryFn: async () => {
      if (!id) throw new Error('Connection ID is required')
      // Note: This would need a getConnection endpoint in the API
      // For now, we'll use the connections list
      const response = await api.getConnections()
      return response.data.find((c) => c.id === id) || null
    },
    enabled: !!id,
    staleTime: 30000,
  })
}
