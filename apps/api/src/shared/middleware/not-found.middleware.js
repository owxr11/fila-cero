export function notFoundMiddleware(req, res) {
    return res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
        },
        meta: {
            requestId: req.id
        }
    })
}
