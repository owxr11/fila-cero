import { Router } from 'express'
import * as controller from './auth.controller.js'
import * as schema from './auth.schema.js'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { loginLimiter, registerLimiter } from '../../shared/middleware/rate-limit.middleware.js'
import { validate } from '../../shared/middleware/validate.middleware.js'

const router = Router()

router.post('/register',
    registerLimiter,
    validate(schema.registerSchema),
    asyncHandler(controller.register)
)

router.post('/login',
    loginLimiter,
    validate(schema.loginSchema),
    asyncHandler(controller.login)
)

router.post('/refresh',
    validate(schema.refreshSchema),
    asyncHandler(controller.refresh)
)

router.post('/logout',
    validate(schema.refreshSchema),
    asyncHandler(controller.logout)
)

router.get('/me',
    authenticate,
    validate(schema.meSchema),
    asyncHandler(controller.me)
)

export default router
