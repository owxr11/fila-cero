import { Router } from 'express'

import healthRoutes from '../modules/health/health.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import userRoutes from '../modules/users/user.routes.js'
import serviceRoutes from '../modules/services/service.routes.js'
import counterRoutes from '../modules/counters/counter.routes.js'
import ticketRoutes from '../modules/tickets/tickets.routes.js'
import queueRoutes from '../modules/queue/queue.routes.js'
import attentionRoutes from '../modules/attention/attention.routes.js'
import { ticketLimiter } from '../shared/middleware/rate-limit.middleware.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)       
router.use('/users', userRoutes)
router.use('/services', serviceRoutes)
router.use('/counters', counterRoutes)
router.post('/tickets', ticketLimiter)
router.use('/tickets', ticketRoutes)
router.use('/queue', queueRoutes)
router.use('/attention', attentionRoutes)

export default router
