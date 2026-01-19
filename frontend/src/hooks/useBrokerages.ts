import { useQuery } from '@tanstack/react-query'
import { getBrokerages } from '../services/api'
import type { Brokerage } from '../types'

export function useBrokerages(options?: { showConnected?: boolean }) {
  return useQuery<Brokerage[], Error>({
    queryKey: ['brokerages', options],
    queryFn: async () => {
      const response = await getBrokerages(options)
      return response.data
    },
  })
}
