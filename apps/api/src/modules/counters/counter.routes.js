import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './counter.controller.js'
import * as schema from './counter.schema.js'

const router = Router()

router.get('/',
    authenticate,
    authorize('counters:read'),
    validate(schema.listCountersSchema),
    asyncHandler(controller.listCounters)
)

router.post('/',
    authenticate,
    authorize('counters:create'),
    validate(schema.createCounterSchema),
    asyncHandler(controller.createCounter)
)

router.patch('/:id',
    authenticate,
    authorize('counters:update'),
    validate(schema.updateCounterSchema),
    asyncHandler(controller.updateCounter)
)

export default router
