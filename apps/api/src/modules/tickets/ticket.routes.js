import { Router } from 'express'
import { notImplemented } from '../../shared/middleware/not-implemented.middleware.js'


const router = Router()

router.use(notImplemented('Integrante 3'))

export default router
