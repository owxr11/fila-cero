import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './service.controller.js'
import * as schema from './service.schema.js'

const router = Router()

router.get('/',
    validate(schema.listServicesSchema),
    asyncHandler(controller.listServices)
)

router.get('/:id',
    validate(schema.getServiceSchema),
    asyncHandler(controller.getService)
)

router.post('/',
    authenticate,
    authorize('services:create'),
    validate(schema.createServiceSchema),
    asyncHandler(controller.createService)
)

router.patch('/:id',
    authenticate,
    authorize('services:update'),
    validate(schema.updateServiceSchema),
    asyncHandler(controller.updateService)
)

export default router
