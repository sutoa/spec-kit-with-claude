import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { ConnectionModel } from '../models/connection.js'
import { InstitutionModel } from '../models/institution.js'
import { AccountModel } from '../models/account.js'
import { ConnectionService } from '../services/connection.js'

const router: RouterType = Router()

/**
 * Supported SnapTrade brokerages for auto-creating institutions
 */
const SNAPTRADE_BROKERAGES: Record<string, { name: string; slug: string }> = {
  'aj-bell': { name: 'AJ Bell', slug: 'AJ-BELL' },
  'alpaca': { name: 'Alpaca', slug: 'ALPACA' },
  'alpaca-paper': { name: 'Alpaca Paper', slug: 'ALPACA-PAPER' },
  'binance': { name: 'Binance', slug: 'BINANCE' },
  'bux': { name: 'BUX', slug: 'BUX' },
  'chase': { name: 'Chase', slug: 'CHASE' },
  'coinbase': { name: 'Coinbase', slug: 'COINBASE' },
  'commsec': { name: 'Commsec', slug: 'COMMSEC' },
  'etrade': { name: 'E*TRADE', slug: 'ETRADE' },
  'empower': { name: 'Empower', slug: 'EMPOWER' },
  'fidelity': { name: 'Fidelity', slug: 'FIDELITY' },
  'interactive-brokers': { name: 'Interactive Brokers', slug: 'INTERACTIVE-BROKERS' },
  'kraken': { name: 'Kraken', slug: 'KRAKEN' },
  'moomoo': { name: 'Moomoo', slug: 'MOOMOO' },
  'public': { name: 'Public', slug: 'PUBLIC' },
  'questrade': { name: 'Questrade', slug: 'QUESTRADE' },
  'robinhood': { name: 'Robinhood', slug: 'ROBINHOOD' },
  'schwab': { name: 'Schwab', slug: 'SCHWAB' },
  'stake': { name: 'Stake', slug: 'STAKE' },
  'tastytrade': { name: 'tastytrade', slug: 'TASTYTRADE' },
  'tradier': { name: 'Tradier', slug: 'TRADIER' },
  'tradestation': { name: 'TradeStation', slug: 'TRADESTATION' },
  'trading212': { name: 'Trading 212', slug: 'TRADING212' },
  'upstox': { name: 'Upstox', slug: 'UPSTOX' },
  'vanguard': { name: 'Vanguard', slug: 'VANGUARD' },
  'wealthsimple': { name: 'Wealthsimple', slug: 'WEALTHSIMPLE' },
  'webull': { name: 'Webull', slug: 'WEBULL' },
  'wells-fargo': { name: 'Wells Fargo', slug: 'WELLS-FARGO' },
  'zerodha': { name: 'Zerodha', slug: 'ZERODHA' },
}

// Validation schemas
const CredentialsSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('api_key'),
    apiKey: z.string().min(1, 'API key is required'),
    apiSecret: z.string().min(1, 'API secret is required'),
  }),
  z.object({
    type: z.literal('credentials'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
])

const CreateConnectionSchema = z.object({
  institutionId: z.string().min(1, 'Institution ID is required'),
  credentials: CredentialsSchema.optional(),
})

/**
 * GET /connections
 * List all active connections
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const connections = ConnectionModel.findAll()

    res.json({
      data: connections,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /connections/:id
 * Get connection details with accounts
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectionId = parseInt(req.params.id, 10)

    if (isNaN(connectionId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid connection ID format. Must be a number.',
      })
      return
    }

    const connection = ConnectionModel.findById(connectionId)

    if (!connection) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Connection with id ${connectionId} not found.`,
      })
      return
    }

    const institution = InstitutionModel.findById(connection.institutionId)
    const accounts = AccountModel.findByConnectionId(connectionId)

    res.json({
      ...connection,
      institution,
      accounts,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /connections
 * Create a new institution connection
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const parseResult = CreateConnectionSchema.safeParse(req.body)

    if (!parseResult.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters.',
        details: parseResult.error.errors,
      })
      return
    }

    const { institutionId, credentials } = parseResult.data

    // Check if institution exists, auto-create if it's a valid SnapTrade brokerage
    let institution = InstitutionModel.findById(institutionId)
    if (!institution) {
      // Try to find in SnapTrade brokerages list (normalize ID for lookup)
      const normalizedId = institutionId.toLowerCase().replace(/\s+/g, '-')
      const brokerageInfo = SNAPTRADE_BROKERAGES[normalizedId]

      if (brokerageInfo) {
        // Auto-create the institution for this SnapTrade brokerage
        institution = InstitutionModel.create({
          id: normalizedId,
          name: brokerageInfo.name,
          apiType: 'api',
          authType: 'oauth',
        })
      } else {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: `Institution with id '${institutionId}' not found.`,
        })
        return
      }
    }

    // Check if connection already exists
    const existingConnection = ConnectionModel.findByInstitutionId(institutionId)
    if (existingConnection) {
      res.status(409).json({
        error: 'CONNECTION_EXISTS',
        message: `A connection to ${institution.name} already exists.`,
      })
      return
    }

    // Create connection using ConnectionService
    const connection = await ConnectionService.createConnection({
      institutionId,
      credentials,
    })

    res.status(201).json(connection)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /connections/:id
 * Disconnect an institution
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectionId = parseInt(req.params.id, 10)

    if (isNaN(connectionId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid connection ID format. Must be a number.',
      })
      return
    }

    // Delete connection using ConnectionService (handles SnapTrade cleanup)
    try {
      await ConnectionService.deleteConnection(connectionId)
      res.status(204).send()
    } catch (error) {
      // Handle connection not found error
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: error.message,
        })
        return
      }
      throw error
    }
  } catch (error) {
    next(error)
  }
})

/**
 * POST /connections/:id/sync
 * Sync account data from institution
 */
router.post('/:id/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectionId = parseInt(req.params.id, 10)

    if (isNaN(connectionId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid connection ID format. Must be a number.',
      })
      return
    }

    const connection = ConnectionModel.findById(connectionId)

    if (!connection) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Connection with id ${connectionId} not found.`,
      })
      return
    }

    const institution = InstitutionModel.findById(connection.institutionId)

    if (institution?.apiType === 'manual') {
      res.status(422).json({
        error: 'SYNC_NOT_SUPPORTED',
        message: `Sync is not supported for manual institutions like ${institution.name}.`,
      })
      return
    }

    // Sync using ConnectionService
    const result = await ConnectionService.syncConnection(connectionId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /connections/:id/portal-url
 * Get the SnapTrade connection portal URL for OAuth authentication
 */
router.get('/:id/portal-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectionId = parseInt(req.params.id, 10)

    if (isNaN(connectionId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid connection ID format. Must be a number.',
      })
      return
    }

    const connection = ConnectionModel.findById(connectionId)

    if (!connection) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Connection with id ${connectionId} not found.`,
      })
      return
    }

    // Get the SnapTrade portal URL
    const broker = req.query.broker as string | undefined
    const portalUrl = await ConnectionService.getConnectionPortalUrl(connectionId, broker)

    res.json({ url: portalUrl })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /connections/:id/status
 * Get the connection status (used for polling after OAuth)
 */
router.get('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectionId = parseInt(req.params.id, 10)

    if (isNaN(connectionId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid connection ID format. Must be a number.',
      })
      return
    }

    const connection = ConnectionModel.findById(connectionId)

    if (!connection) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Connection with id ${connectionId} not found.`,
      })
      return
    }

    const accounts = AccountModel.findByConnectionId(connectionId)

    res.json({
      id: connection.id,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      errorMessage: connection.errorMessage,
      accountCount: accounts.length,
    })
  } catch (error) {
    next(error)
  }
})

export default router
