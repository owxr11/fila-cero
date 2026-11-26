import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './organization.controller.js'
import * as schema from './organization.schema.js'

const router = Router()

router.get('/:id',
    validate(schema.getOrganizationSchema),
    asyncHandler(controller.getOrganization)
)

router.patch('/:id',
    authenticate,
    authorize('organizations:update'),
    validate(schema.updateOrganizationSchema),
    asyncHandler(controller.updateOrganization)
)

export default router
