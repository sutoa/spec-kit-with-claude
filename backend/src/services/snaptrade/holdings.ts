import { getSnaptradeClient } from './client.js'

export interface SnaptradeHolding {
  symbol: string
  description: string
  units: number
  price: number
  marketValue: number
  averagePurchasePrice: number | null
  currency: string
}

export interface SnaptradeAccountHoldings {
  accountId: string
  accountName: string
  totalValue: number
  holdings: SnaptradeHolding[]
}

interface SnaptradeHoldingResponse {
  symbol?: { symbol?: string; description?: string }
  units?: number
  price?: number
  average_purchase_price?: number
  currency?: { code?: string }
}

export async function getAccountHoldings(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<SnaptradeAccountHoldings> {
  const client = getSnaptradeClient()

  const response = await client.accountInformation.getUserHoldings({
    userId,
    userSecret,
    accountId,
  })

  // Handle different response formats from SnapTrade API
  let rawHoldings: SnaptradeHoldingResponse[] = []

  if (Array.isArray(response.data)) {
    rawHoldings = response.data as SnaptradeHoldingResponse[]
  } else if (response.data && typeof response.data === 'object') {
    // Some endpoints return { positions: [...] } or similar structure
    const data = response.data as Record<string, unknown>
    if (Array.isArray(data.positions)) {
      rawHoldings = data.positions as SnaptradeHoldingResponse[]
    } else if (Array.isArray(data.holdings)) {
      rawHoldings = data.holdings as SnaptradeHoldingResponse[]
    }
  }

  const holdings: SnaptradeHolding[] = rawHoldings.map((holding) => ({
    symbol: holding.symbol?.symbol || 'UNKNOWN',
    description: holding.symbol?.description || '',
    units: holding.units ?? 0,
    price: holding.price ?? 0,
    marketValue: (holding.units ?? 0) * (holding.price ?? 0),
    averagePurchasePrice: holding.average_purchase_price ?? null,
    currency: holding.currency?.code || 'USD',
  }))

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

  return {
    accountId,
    accountName: '', // Will be populated from account data
    totalValue,
    holdings,
  }
}

export async function getAllUserHoldings(
  userId: string,
  userSecret: string
): Promise<SnaptradeAccountHoldings[]> {
  const client = getSnaptradeClient()

  // Get all accounts first
  const accountsResponse = await client.accountInformation.listUserAccounts({
    userId,
    userSecret,
  })

  const accounts = accountsResponse.data || []
  const results: SnaptradeAccountHoldings[] = []

  // Fetch holdings for each account
  for (const account of accounts) {
    if (!account.id) continue

    try {
      const holdings = await getAccountHoldings(userId, userSecret, account.id)
      holdings.accountName = account.name || 'Unknown Account'
      results.push(holdings)
    } catch (error) {
      console.error(`Failed to fetch holdings for account ${account.id}:`, error)
      // Continue with other accounts even if one fails
    }
  }

  return results
}
