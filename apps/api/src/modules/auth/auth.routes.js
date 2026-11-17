import { Router } from 'express'
import { notImplemented } from '../../shared/middleware/not-implemented.middleware.js'

const router = Router()

router.use(notImplemented('Integrante 1'))

export default router
