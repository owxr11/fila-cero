export function notImplemented(owner) {
    return function notImplementedMiddleware(req, res) {
        return res.status(501).json({
            success: false,
            error: {
                code: 'NOT_IMPLEMENTED',
                message: `Pendiente de implementar (${owner})`
            },
            meta: {
                requestId: req.id
            }
        })
    }
}
