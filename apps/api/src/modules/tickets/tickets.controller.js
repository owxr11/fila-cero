import * as service from './tickets.service.js'

export async function create(req, res) {
    const ticket = await service.createTicket(req.validated.body)

    return res.status(201).json({
        success: true,
        data: ticket,
        meta: {
            requestId: req.id
        }
    })
}
