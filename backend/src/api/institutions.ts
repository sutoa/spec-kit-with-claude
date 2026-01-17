import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express'
import { InstitutionModel } from '../models/institution.js'
import * as snaptradeAccounts from '../services/snaptrade/accounts.js'
import type { InstitutionWithConnection } from '../types/index.js'

const router: RouterType = Router()

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
 * GET /institutions
 * List all supported institutions with connection status from SnapTrade
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get base institutions from our database
    const institutions = InstitutionModel.findAll()

    // Get connected brokerages from SnapTrade
    const creds = getFixedSnaptradeCredentials()
    let connectedBrokerages: Array<{
      id: string
      brokerageName: string
      brokerageSlug: string
      createdAt: string
    }> = []

    if (creds) {
      try {
        connectedBrokerages = await snaptradeAccounts.listUserConnections(creds.userId, creds.userSecret)
      } catch (e) {
        console.warn('Failed to fetch SnapTrade connections:', e)
      }
    }

    // Create a map of connected brokerages by name/slug for quick lookup
    const connectedMap = new Map<string, typeof connectedBrokerages[0]>()
    for (const brokerage of connectedBrokerages) {
      // Map by both name and slug (lowercase for matching)
      connectedMap.set(brokerage.brokerageName.toLowerCase(), brokerage)
      connectedMap.set(brokerage.brokerageSlug.toLowerCase(), brokerage)
    }

    // Enhance institutions with connection status from SnapTrade
    const institutionsWithConnections: InstitutionWithConnection[] = institutions.map((inst) => {
      // Try to match by institution name or id
      const connected = connectedMap.get(inst.name.toLowerCase()) ||
                       connectedMap.get(inst.id.toLowerCase())

      if (connected) {
        // Calculate relative time
        const lastUpdated = new Date(connected.createdAt)
        const now = new Date()
        const diffMs = now.getTime() - lastUpdated.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        let lastUpdatedRelative: string
        if (diffDays > 0) {
          lastUpdatedRelative = `${diffDays}d ago`
        } else if (diffHours > 0) {
          lastUpdatedRelative = `${diffHours}h ago`
        } else if (diffMins > 0) {
          lastUpdatedRelative = `${diffMins}m ago`
        } else {
          lastUpdatedRelative = 'just now'
        }

        return {
          ...inst,
          connection: {
            id: 0, // Virtual connection (not stored locally)
            institutionId: inst.id,
            status: 'connected' as const,
            lastSyncAt: new Date(connected.createdAt),
            errorMessage: null,
            snaptradeUserId: null,
            snaptradeUserSecret: null,
            createdAt: new Date(connected.createdAt),
            updatedAt: new Date(connected.createdAt),
          },
          lastUpdatedRelative,
        }
      }

      return {
        ...inst,
        connection: null,
        lastUpdatedRelative: null,
      }
    })

    res.json({
      data: institutionsWithConnections,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /institutions/:id
 * Get institution details with connection status
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const institution = InstitutionModel.findById(id)

    if (!institution) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Institution with id '${id}' not found.`,
      })
      return
    }

    // Check SnapTrade for connection status
    const creds = getFixedSnaptradeCredentials()
    let isConnected = false
    let connectedAt: Date | null = null

    if (creds) {
      try {
        const connections = await snaptradeAccounts.listUserConnections(creds.userId, creds.userSecret)
        const match = connections.find(
          (c) => c.brokerageName.toLowerCase() === institution.name.toLowerCase() ||
                 c.brokerageSlug.toLowerCase() === institution.id.toLowerCase()
        )
        if (match) {
          isConnected = true
          connectedAt = new Date(match.createdAt)
        }
      } catch (e) {
        console.warn('Failed to fetch SnapTrade connections:', e)
      }
    }

    const result: InstitutionWithConnection = {
      ...institution,
      connection: isConnected ? {
        id: 0,
        institutionId: institution.id,
        status: 'connected',
        lastSyncAt: connectedAt,
        errorMessage: null,
        snaptradeUserId: null,
        snaptradeUserSecret: null,
        createdAt: connectedAt || new Date(),
        updatedAt: connectedAt || new Date(),
      } : null,
      lastUpdatedRelative: connectedAt ? 'connected' : null,
    }

    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
