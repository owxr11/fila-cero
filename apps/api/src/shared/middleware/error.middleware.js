import { logger } from '../../config/logger.js'

const BODY_ERRORS = Object.freeze({
    'entity.parse.failed': {
        code: 'INVALID_JSON',
        message: 'El cuerpo de la petición no es un JSON válido'
    },
    'entity.too.large': {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'El cuerpo de la petición es demasiado grande'
    }
})

export function errorMiddleware(err, req, res, _next) {
    const statusCode = err.statusCode ?? 500
    const bodyError = BODY_ERRORS[err.type]

    const context = {
        error: err,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl
    }

    if (statusCode < 500) {
        logger.warn(context, 'Request failed')
    } else {
        logger.error(context, 'Unhandled application error')
    }

    return res.status(statusCode).json({
        success: false,
        error: {
            code: bodyError?.code ?? err.code ?? 'INTERNAL_SERVER_ERROR',
            message: statusCode >= 500 ? 'Error interno del servidor' : bodyError?.message ?? err.message,
            ...(err.details ? { details: err.details } : {})
        },
        meta: {
            requestId: req.id
        }
    })
}
