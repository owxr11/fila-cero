import { rateLimit } from 'express-rate-limit'
import { env } from '../../config/env.js'
import { AppError } from '../errors/app-errors.js'

function createLimiter({ windowMinutes, limit, message, skipSuccessfulRequests = false }) {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit,
        skipSuccessfulRequests,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skip: () => !env.RATE_LIMIT_ENABLED,
        handler(_req, _res, next) {
            next(new AppError({
                statusCode: 429,
                code: 'TOO_MANY_REQUESTS',
                message
            }))
        }
    })
}

export const loginLimiter = createLimiter({
    windowMinutes: 15,
    limit: 10,
    skipSuccessfulRequests: true,
    message: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo'
})

export const registerLimiter = createLimiter({
    windowMinutes: 60,
    limit: 10,
    message: 'Se crearon demasiadas cuentas desde esta red. Inténtalo más tarde'
})

export const ticketLimiter = createLimiter({
    windowMinutes: 10,
    limit: 30,
    message: 'Se emitieron demasiados turnos desde esta red. Espera unos minutos'
})
