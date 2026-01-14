import type { SnaptradeUserCredentials } from '../../src/services/snaptrade/client.js'

/**
 * Mock SnapTrade client for testing
 * Simulates SnapTrade API behavior without requiring real credentials
 */

const mockUsers = new Map<string, SnaptradeUserCredentials>()

export const mockSnaptradeClient = {
  /**
   * Mock registerSnapTradeUser
   */
  registerSnapTradeUser: async (userId: string): Promise<SnaptradeUserCredentials> => {
    const userSecret = `secret-${userId}-${Date.now()}`
    const credentials = { userId, userSecret }
    mockUsers.set(userId, credentials)
    return credentials
  },

  /**
   * Mock deleteSnapTradeUser
   */
  deleteSnaptradeUser: async (userId: string): Promise<void> => {
    mockUsers.delete(userId)
  },

  /**
   * Mock getConnectionPortalUrl
   */
  getConnectionPortalUrl: async (
    userId: string,
    userSecret: string,
    broker?: string
  ): Promise<string> => {
    return `https://mock.snaptrade.com/connect?user=${userId}&broker=${broker || 'default'}`
  },

  /**
   * Mock listBrokerages
   */
  listBrokerages: async (): Promise<Array<{ id: string; name: string; slug: string }>> => {
    return [
      { id: 'alpaca', name: 'Alpaca', slug: 'alpaca' },
      { id: 'vanguard', name: 'Vanguard', slug: 'vanguard' },
      { id: 'schwab', name: 'Schwab', slug: 'schwab' },
    ]
  },
}

/**
 * Mock getAccounts
 */
export const mockGetAccounts = async (userId: string, userSecret: string) => {
  return [
    {
      id: 'mock-account-1',
      name: 'Test Brokerage Account',
      number: '1234',
      type: 'brokerage',
      balance: {
        cash: 5000.0,
        total: 25000.0,
      },
    },
  ]
}

/**
 * Mock getHoldings
 */
export const mockGetHoldings = async (userId: string, userSecret: string, accountId: string) => {
  return [
    {
      symbol: 'AAPL',
      units: 10,
      price: 150.0,
      value: 1500.0,
    },
    {
      symbol: 'GOOGL',
      units: 5,
      price: 140.0,
      value: 700.0,
    },
  ]
}

/**
 * Reset mock state between tests
 */
export const resetMockSnapTrade = () => {
  mockUsers.clear()
}
