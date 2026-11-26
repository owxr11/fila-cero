import * as service from './attention.service.js'

function respond(req, res, data) {
    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function callNext(req, res) {
    return respond(req, res, await service.callNext(req.validated.body, req.auth))
}

export async function start(req, res) {
    return respond(req, res, await service.startTicket(req.validated.params.ticketId, req.validated.body, req.auth))
}

export async function finish(req, res) {
    return respond(req, res, await service.finishTicket(req.validated.params.ticketId, req.validated.body, req.auth))
}

export async function cancel(req, res) {
    return respond(req, res, await service.cancelTicket(req.validated.params.ticketId, req.validated.body, req.auth))
}

export async function getCounterTicket(req, res) {
    return respond(req, res, await service.getCounterTicket(req.validated.params.counterId))
}