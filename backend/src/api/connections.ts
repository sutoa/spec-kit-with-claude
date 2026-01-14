import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { ConnectionModel } from '../models/connection.js'
import { InstitutionModel } from '../models/institution.js'
import { AccountModel } from '../models/account.js'
import { ConnectionService } from '../services/connection.js'

const router: RouterType = Router()

// Validation schemas
const CreateConnectionSchema = z.object({
  institutionId: z.string().min(1, 'Institution ID is required'),
  credentials: z.discriminatedUnion('type', [
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
  ]),
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

    // Check if institution exists
    const institution = InstitutionModel.findById(institutionId)
    if (!institution) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Institution with id '${institutionId}' not found.`,
      })
      return
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

export default router
