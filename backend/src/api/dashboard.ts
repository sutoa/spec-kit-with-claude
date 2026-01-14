import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express'
import { DashboardService } from '../services/dashboard.js'

const router: RouterType = Router()

/**
 * GET /dashboard
 * Get consolidated dashboard report
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate as string | undefined
    const institutionIdsParam = req.query.institutionIds as string | string[] | undefined

    // Parse institutionIds - could be comma-separated string or array
    let institutionIds: string[] | undefined
    if (institutionIdsParam) {
      if (Array.isArray(institutionIdsParam)) {
        institutionIds = institutionIdsParam
      } else {
        institutionIds = institutionIdsParam.split(',').map((id) => id.trim())
      }
    }

    const dashboard = DashboardService.getDashboard({
      asOfDate,
      institutionIds,
    })

    res.json(dashboard)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /dashboard/refresh
 * Refresh all connected institution data
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DashboardService.refreshDashboard()
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /dashboard/export
 * Export dashboard as CSV
 */
router.get('/export', (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate as string | undefined

    const csv = DashboardService.exportDashboardCSV({ asOfDate })

    const filename = asOfDate
      ? `account-report-${asOfDate}.csv`
      : `account-report-${new Date().toISOString().split('T')[0]}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    next(error)
  }
})

export default router
