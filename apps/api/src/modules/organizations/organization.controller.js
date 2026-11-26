import * as service from './organization.service.js'

export async function getOrganization(req, res) {
    const data = await service.getOrganization(req.validated.params.id)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function updateOrganization(req, res) {
    const data = await service.updateOrganization(req.validated.params.id, req.validated.body)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
