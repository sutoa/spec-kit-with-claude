import { Snaptrade } from 'snaptrade-typescript-sdk'

let snaptradeClient: Snaptrade | null = null

export function getSnaptradeClient(): Snaptrade {
  if (!snaptradeClient) {
    const clientId = process.env.SNAPTRADE_CLIENT_ID
    const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY

    if (!clientId || !consumerKey) {
      throw new Error(
        'SnapTrade credentials not configured. Set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY environment variables.'
      )
    }

    snaptradeClient = new Snaptrade({
      clientId,
      consumerKey,
    })
  }

  return snaptradeClient
}

export interface SnaptradeUserCredentials {
  userId: string
  userSecret: string
}

export async function registerSnaptradeUser(userId: string): Promise<SnaptradeUserCredentials> {
  const client = getSnaptradeClient()

  const response = await client.authentication.registerSnapTradeUser({
    userId,
  })

  if (!response.data.userId || !response.data.userSecret) {
    throw new Error('Failed to register SnapTrade user')
  }

  return {
    userId: response.data.userId,
    userSecret: response.data.userSecret,
  }
}

export async function deleteSnaptradeUser(userId: string): Promise<void> {
  const client = getSnaptradeClient()

  await client.authentication.deleteSnapTradeUser({
    userId,
  })
}

export async function getConnectionPortalUrl(
  userId: string,
  userSecret: string,
  broker?: string
): Promise<string> {
  const client = getSnaptradeClient()

  const response = await client.authentication.loginSnapTradeUser({
    userId,
    userSecret,
    broker,
  })

  // The response contains a redirect URI that the user should visit
  // Handle different response shapes from the SDK
  const data = response.data as Record<string, unknown>
  const redirectUri = (data.redirectURI || data.loginRedirectURI || data.redirect_uri) as string | undefined

  if (!redirectUri) {
    throw new Error('Failed to get SnapTrade connection portal URL')
  }

  return redirectUri
}

export async function listBrokerages(): Promise<
  Array<{
    id: string
    name: string
    slug: string
  }>
> {
  const client = getSnaptradeClient()

  const response = await client.referenceData.listAllBrokerages()

  return (
    response.data?.map((b) => ({
      id: b.id?.toString() || '',
      name: b.name || '',
      slug: b.slug || '',
    })) || []
  )
}
