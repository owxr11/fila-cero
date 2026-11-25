import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './attention.controller.js'
import * as schema from './attention.schema.js'

const router = Router()

// Todas las rutas son solo para OPERATOR y ADMIN:
// tickets:update y tickets:read los tienen OPERATOR y ADMIN ('*'); VISITOR no (403)
router.post('/call-next',
    authenticate,
    authorize('tickets:update'),
    validate(schema.callNextSchema),
    asyncHandler(controller.callNext)
)

router.post('/:ticketId/start',
    authenticate,
    authorize('tickets:update'),
    validate(schema.ticketActionSchema),
    asyncHandler(controller.start)
)

router.post('/:ticketId/finish',
    authenticate,
    authorize('tickets:update'),
    validate(schema.ticketActionSchema),
    asyncHandler(controller.finish)
)

router.post('/:ticketId/cancel',
    authenticate,
    authorize('tickets:update'),
    validate(schema.ticketActionSchema),
    asyncHandler(controller.cancel)
)

router.get('/counter/:counterId',
    authenticate,
    authorize('tickets:read'),
    validate(schema.getCounterTicketSchema),
    asyncHandler(controller.getCounterTicket)
)

export default router