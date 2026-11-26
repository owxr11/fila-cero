import * as service from './history.service.js'

export async function listHistory(req, res) {
    const { filters, items } = await service.listHistory(req.validated.query)

    return res.status(200).json({
        success: true,
        data: items,
        meta: {
            count: items.length,
            filters,
            requestId: req.id
        }
    })
}

export async function getSummary(req, res) {
    const data = await service.getSummary(req.validated.query)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
