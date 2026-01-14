import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express'
import { InstitutionModel } from '../models/institution.js'

const router: RouterType = Router()

/**
 * GET /institutions
 * List all supported institutions with connection status
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const institutions = InstitutionModel.findAllWithConnections()

    res.json({
      data: institutions,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /institutions/:id
 * Get institution details with connection status
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const institution = InstitutionModel.findByIdWithConnection(id)

    if (!institution) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Institution with id '${id}' not found.`,
      })
      return
    }

    res.json(institution)
  } catch (error) {
    next(error)
  }
})

export default router
