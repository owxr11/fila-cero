import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './queue.controller.js'
import * as schema from './queue.schema.js'


const router = Router()
// Ambos rutas son publicas, no requieren autenticación
router.get('/tickets/:id',
    validate(schema.getTicketStatusSchema),
    asyncHandler(controller.getTicketStatus)
)

router.get('/',
    validate(schema.getQueueSchema),
    asyncHandler(controller.getQueue)
)

export default router
