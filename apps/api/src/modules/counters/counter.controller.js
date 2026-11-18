import * as service from './counter.service.js'

export async function listCounters(req, res) {
    const counters = await service.listCounters(req.validated.query)

    return res.status(200).json({
        success: true,
        data: counters,
        meta: {
            count: counters.length,
            requestId: req.id
        }
    })
}

export async function createCounter(req, res) {
    const data = await service.createCounter(req.validated.body)

    return res.status(201).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function updateCounter(req, res) {
    const data = await service.updateCounter(req.validated.params.id, req.validated.body)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
