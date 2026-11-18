import * as service from './queue.service.js'

// getTicketStatus es una función que obtiene el estado de un ticket específico.
export async function getTicketStatus(req, res) {
    const data = await service.getTicketStatus(req.validated.params.id)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

// getQueue es una función que obtiene la información de la cola de tickets.
export async function getQueue(req, res) {
    const data = await service.getQueue(req.validated.query)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}