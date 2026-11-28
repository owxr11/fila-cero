import { AppError } from '../errors/app-errors.js'
import { verifySession } from '../security/session.js'
import { verifyAccessToken } from '../security/tokens.js'


export async function authenticate(req, _res, next) {
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return next(new AppError({
            statusCode: 401,
            code: 'AUTH_REQUIRED',
            message: 'Autenticación requerida'
        }))
    }

    const token = authorization.slice(7)
    let payload

    try {
        payload = verifyAccessToken(token)
    } catch {
        return next(new AppError({
            statusCode: 401,
            code: 'INVALID_ACCESS_TOKEN',
            message: 'Token de acceso inválido'
        }))
    }

    try {
        await verifySession(payload)
    } catch (error) {
        return next(error)
    }

    req.auth = {
        userId: payload.sub,
        role: payload.role
    }
    return next()
}
