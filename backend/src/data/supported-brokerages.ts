/**
 * Official list of SnapTrade supported brokerages
 * Source: https://snaptrade.com/brokerage-integrations
 */
export const SUPPORTED_BROKERAGES: Array<{ name: string; slug: string }> = [
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
 * Check if a slug matches a supported brokerage (case-insensitive)
 */
export function findBrokerageBySlug(slug: string): { name: string; slug: string } | undefined {
  const normalizedSlug = slug.toUpperCase()
  return SUPPORTED_BROKERAGES.find(b => b.slug.toUpperCase() === normalizedSlug)
}

/**
 * Check if a slug is a valid supported brokerage
 */
export function isValidBrokerageSlug(slug: string): boolean {
  return findBrokerageBySlug(slug) !== undefined
}
