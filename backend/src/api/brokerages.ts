import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express'
import * as snaptradeAccounts from '../services/snaptrade/accounts.js'
import type { Brokerage } from '../types/index.js'

const router: RouterType = Router()

/**
 * Official list of SnapTrade supported brokerages
 * Source: https://snaptrade.com/brokerage-integrations
 */
const SUPPORTED_BROKERAGES: Array<{ name: string; slug: string }> = [
  { name: 'AJ Bell', slug: 'AJ-BELL' },
  { name: 'Alpaca', slug: 'ALPACA' },
  { name: 'Alpaca Paper', slug: 'ALPACA-PAPER' },
  { name: 'Binance', slug: 'BINANCE' },
  { name: 'BUX', slug: 'BUX' },
  { name: 'Chase', slug: 'CHASE' },
  { name: 'Coinbase', slug: 'COINBASE' },
  { name: 'Commsec', slug: 'COMMSEC' },
  { name: 'E*TRADE', slug: 'ETRADE' },
  { name: 'Empower', slug: 'EMPOWER' },
  { name: 'Fidelity', slug: 'FIDELITY' },
  { name: 'Interactive Brokers', slug: 'INTERACTIVE-BROKERS' },
  { name: 'Kraken', slug: 'KRAKEN' },
  { name: 'Moomoo', slug: 'MOOMOO' },
  { name: 'Public', slug: 'PUBLIC' },
  { name: 'Questrade', slug: 'QUESTRADE' },
  { name: 'Robinhood', slug: 'ROBINHOOD' },
  { name: 'Schwab', slug: 'SCHWAB' },
  { name: 'Stake', slug: 'STAKE' },
  { name: 'tastytrade', slug: 'TASTYTRADE' },
  { name: 'Tradier', slug: 'TRADIER' },
  { name: 'TradeStation', slug: 'TRADESTATION' },
  { name: 'Trading 212', slug: 'TRADING212' },
  { name: 'Upstox', slug: 'UPSTOX' },
  { name: 'Vanguard', slug: 'VANGUARD' },
  { name: 'Wealthsimple', slug: 'WEALTHSIMPLE' },
  { name: 'Webull', slug: 'WEBULL' },
  { name: 'Wells Fargo', slug: 'WELLS-FARGO' },
  { name: 'Zerodha', slug: 'ZERODHA' },
]

/**
 * Get fixed SnapTrade user credentials from environment variables
 */
function getFixedSnaptradeCredentials(): { userId: string; userSecret: string } | null {
  const userId = process.env.SNAPTRADE_USER_ID
  const userSecret = process.env.SNAPTRADE_USER_SECRET

  if (!userId || !userSecret || userId === 'your-user-id-here' || userSecret === 'your-user-secret-here') {
    return null
  }

  return { userId, userSecret }
}

/**
 * GET /brokerages
 * List all available SnapTrade brokerages with connection status
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const showConnected = req.query.showConnected !== 'false'

    // Get connected brokerages for the current user
    const creds = getFixedSnaptradeCredentials()
    let connectedSlugs = new Set<string>()

    if (creds) {
      try {
        const connections = await snaptradeAccounts.listUserConnections(creds.userId, creds.userSecret)
        // Normalize slugs for comparison
        connectedSlugs = new Set(connections.map(c => c.brokerageSlug.toUpperCase().replace(/\s+/g, '-')))
      } catch (e) {
        console.warn('Failed to fetch connected brokerages:', e)
      }
    }

    // Map brokerages with connection status
    let brokerages: Brokerage[] = SUPPORTED_BROKERAGES.map(b => ({
      id: b.slug,
      name: b.name,
      slug: b.slug,
      isConnected: connectedSlugs.has(b.slug.toUpperCase())
    }))

    // Filter out connected brokerages if requested
    if (!showConnected) {
      brokerages = brokerages.filter(b => !b.isConnected)
    }

    // Sort: connected first, then alphabetically by name
    brokerages.sort((a, b) => {
      if (a.isConnected !== b.isConnected) {
        return a.isConnected ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    res.json({ data: brokerages })
  } catch (error) {
    next(error)
  }
})

export default router
