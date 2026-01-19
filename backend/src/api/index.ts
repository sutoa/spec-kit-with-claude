import { Router, type Router as RouterType } from 'express'
import healthRouter from './health.js'
import institutionsRouter from './institutions.js'
import connectionsRouter from './connections.js'
import dashboardRouter from './dashboard.js'
import brokeragesRouter from './brokerages.js'

const router: RouterType = Router()

// Mount route handlers
router.use('/health', healthRouter)
router.use('/institutions', institutionsRouter)
router.use('/connections', connectionsRouter)
router.use('/dashboard', dashboardRouter)
router.use('/brokerages', brokeragesRouter)

// Placeholder routes - will be implemented in later phases
// router.use('/accounts', accountsRouter)

export default router
