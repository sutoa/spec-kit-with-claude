import { Router, type Router as RouterType } from 'express'
import healthRouter from './health.js'
import institutionsRouter from './institutions.js'
import connectionsRouter from './connections.js'
import dashboardRouter from './dashboard.js'

const router: RouterType = Router()

// Mount route handlers
router.use('/health', healthRouter)
router.use('/institutions', institutionsRouter)
router.use('/connections', connectionsRouter)
router.use('/dashboard', dashboardRouter)

// Placeholder routes - will be implemented in later phases
// router.use('/accounts', accountsRouter)

export default router
