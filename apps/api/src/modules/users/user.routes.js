import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import * as controller from './user.controller.js'
import * as schema from './user.schema.js'

const router = Router()

router.get('/',
    authenticate,
    authorize('users:read'),
    validate(schema.listUsersSchema),
    asyncHandler(controller.listUsers)
)

router.post('/',
    authenticate,
    authorize('users:create'),
    validate(schema.createUserSchema),
    asyncHandler(controller.createUser)
)

router.patch('/:id',
    authenticate,
    authorize('users:update'),
    validate(schema.updateUserSchema),
    asyncHandler(controller.updateUser)
)

export default router
