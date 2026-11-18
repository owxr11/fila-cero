import { Router } from 'express'

import healthRoutes from '../modules/health/health.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import serviceRoutes from '../modules/services/service.routes.js'
import counterRoutes from '../modules/counters/counter.routes.js'
import ticketRoutes from '../modules/tickets/tickets.routes.js'
import queueRoutes from '../modules/queue/queue.routes.js'


const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)         //integrante 1
router.use('/services', serviceRoutes)  //integrante 2
router.use('/counters', counterRoutes)  //integrante 2
router.use('/tickets', ticketRoutes)    //integrante 3
router.use('/queue', queueRoutes)       //integrante 4

export default router
