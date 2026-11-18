import * as service from './service.service.js'

export async function listServices(req, res) {
    const services = await service.listServices(req.validated.query)

    return res.status(200).json({
        success: true,
        data: services,
        meta: {
            count: services.length,
            requestId: req.id
        }
    })
}

export async function getService(req, res) {
    const data = await service.getService(req.validated.params.id)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function createService(req, res) {
    const data = await service.createService(req.validated.body)

    return res.status(201).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function updateService(req, res) {
    const data = await service.updateService(req.validated.params.id, req.validated.body)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
