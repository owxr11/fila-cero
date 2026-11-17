import { logger } from '../../config/logger.js'

export function errorMiddleware(err, req, res, _next) {
    const statusCode = err.statusCode ?? 500

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
            code: err.code ?? 'INTERNAL_SERVER_ERROR',
            message: statusCode >= 500 ? 'Error interno del servidor' : err.message,
            ...(err.details ? { details: err.details } : {})
        },
        meta: {
            requestId: req.id
        }
    })
}
