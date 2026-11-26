import { Router } from 'express'
import { validate } from '../../shared/middleware/validate.middleware.js'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { createTicketSchema } from './tickets.schema.js'
import * as controller from './tickets.controller.js'

const ticketRoutes = Router()

ticketRoutes.post('/', validate(createTicketSchema), asyncHandler(controller.create))

export default ticketRoutes
