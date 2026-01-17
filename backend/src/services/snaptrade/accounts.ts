import { getSnaptradeClient } from './client.js'

export interface SnaptradeAccount {
  id: string
  brokerageAuthorization: string
  name: string
  number: string
  institutionName: string
  balance: {
    cash: number | null
    marketValue: number | null
  }
  meta: {
    type: string | null
    status: string | null
  }
}

export async function listUserAccounts(
  userId: string,
  userSecret: string
): Promise<SnaptradeAccount[]> {
  const client = getSnaptradeClient()

  const response = await client.accountInformation.listUserAccounts({
    userId,
    userSecret,
  })

  return (
    response.data?.map((account) => ({
      id: account.id || '',
      brokerageAuthorization: account.brokerage_authorization || '',
      name: account.name || 'Unknown Account',
      number: account.number || '',
      institutionName: account.institution_name || '',
      balance: {
        cash: account.cash ?? null,
        marketValue: account.market_value ?? null,
      },
      meta: {
        type: account.meta?.type ?? null,
        status: account.meta?.status ?? null,
      },
    })) || []
  )
}

export async function getAccountBalances(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<{
  cash: number | null
  marketValue: number | null
  total: number
}> {
  const client = getSnaptradeClient()

  const response = await client.accountInformation.getUserAccountBalance({
    userId,
    userSecret,
    accountId,
  })

  // Response is an array of Balance objects
  const balances = response.data || []
  let cash: number | null = null
  const marketValue: number | null = null

  // Sum up all balances by type
  for (const balance of balances) {
    if (balance.currency?.code === 'USD' || !balance.currency) {
      if (balance.cash !== undefined && balance.cash !== null) {
        cash = (cash ?? 0) + balance.cash
      }
    }
  }

  // Get total value from account details if needed
  const total = (cash ?? 0) + (marketValue ?? 0)

  return {
    cash,
    marketValue,
    total,
  }
}

export async function listUserConnections(
  userId: string,
  userSecret: string
): Promise<
  Array<{
    id: string
    brokerageName: string
    brokerageSlug: string
    createdAt: string
  }>
> {
  const client = getSnaptradeClient()

  const response = await client.connections.listBrokerageAuthorizations({
    userId,
    userSecret,
  })

  return (
    response.data?.map((auth) => ({
      id: auth.id || '',
      brokerageName: auth.brokerage?.name || '',
      brokerageSlug: auth.brokerage?.slug || '',
      createdAt: auth.created_date || new Date().toISOString(),
    })) || []
  )
}

export async function removeConnection(
  userId: string,
  userSecret: string,
  authorizationId: string
): Promise<void> {
  const client = getSnaptradeClient()

  await client.connections.removeBrokerageAuthorization({
    userId,
    userSecret,
    authorizationId,
  })
}
