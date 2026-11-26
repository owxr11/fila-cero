import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './history.controller.js'
import * as schema from './history.schema.js'

const router = Router()

router.get('/summary',
    authenticate,
    authorize('history:read'),
    validate(schema.historyFiltersSchema),
    asyncHandler(controller.getSummary)
)

router.get('/',
    authenticate,
    authorize('history:read'),
    validate(schema.historyFiltersSchema),
    asyncHandler(controller.listHistory)
)

export default router
