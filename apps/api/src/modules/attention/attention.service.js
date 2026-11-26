import { AppError } from '../../shared/errors/app-errors.js'
import { buildDayKey } from '../tickets/tickets.utils.js'
import * as repository from './attention.repository.js'
import { canTransition, pickLowestNumber } from './attention.utils.js'

// Qué estado, evento y hora se guardan en cada operación
const OPERATIONS = Object.freeze({
    start: { to: 'IN_SERVICE', type: 'STARTED', timeField: 'startedAt' },
    finish: { to: 'DONE', type: 'FINISHED', timeField: 'finishedAt' },
    cancel: { to: 'CANCELLED', type: 'CANCELLED', timeField: 'cancelledAt' }
})

function ticketNotFound() {
    return new AppError({
        statusCode: 404,
        code: 'TICKET_NOT_FOUND',
        message: 'Ticket no encontrado'
    })
}

function counterNotFound() {
    return new AppError({
        statusCode: 404,
        code: 'COUNTER_NOT_FOUND',
        message: 'Módulo no encontrado'
    })
}

function invalidTransition(from, to) {
    return new AppError({
        statusCode: 409,
        code: 'INVALID_TRANSITION',
        message: `No se puede cambiar el ticket de ${from} a ${to}`,
        details: { from, to }
    })
}

// Llama al siguiente ticket en espera de los servicios del módulo.
// Todo ocurre en una transacción: si otro operador toma el mismo ticket al mismo tiempo,
// Firestore reintenta una de las dos y la segunda ya no lo ve en espera.
export async function callNext({ counterId }, auth) {
    const dayKey = buildDayKey()

    return repository.runInTransaction(async (tx) => {
        // Lecturas (en Firestore todas van antes de las escrituras)
        const counter = await repository.findCounterById(counterId, tx)

        if (!counter) {
            throw counterNotFound()
        }

        if (!counter.active) {
            throw new AppError({
                statusCode: 409,
                code: 'COUNTER_INACTIVE',
                message: 'El módulo está desactivado'
            })
        }

        const active = await repository.findActiveByCounter(counterId, dayKey, tx)

        if (active) {
            throw new AppError({
                statusCode: 409,
                code: 'COUNTER_BUSY',
                message: 'El módulo ya tiene un ticket activo',
                details: { ticketId: active.id, code: active.code, status: active.status }
            })
        }

        const waiting = await repository.findFirstWaitingByService(counter.serviceIds, dayKey, tx)
        const ticket = pickLowestNumber(waiting)

        if (!ticket) {
            throw new AppError({
                statusCode: 404,
                code: 'NO_WAITING_TICKETS',
                message: 'No hay tickets en espera para este módulo'
            })
        }

        if (!canTransition(ticket.status, 'CALLED')) {
            throw invalidTransition(ticket.status, 'CALLED')
        }

        // Escrituras
        const calledAt = new Date()

        repository.updateTicket(ticket.id, { status: 'CALLED', counterId, calledAt }, tx)
        repository.recordEvent({
            ticketId: ticket.id,
            serviceId: ticket.serviceId,
            type: 'CALLED',
            from: ticket.status,
            to: 'CALLED',
            counterId,
            operatorId: auth.userId
        }, tx)

        return {
            ...ticket,
            status: 'CALLED',
            counterId,
            calledAt: calledAt.toISOString()
        }
    })
}

// Inicia, finaliza o cancela un ticket (misma secuencia: leer, validar, guardar, registrar evento)
async function changeStatus(operation, ticketId, { counterId } = {}, auth) {
    const { to, type, timeField } = OPERATIONS[operation]

    return repository.runInTransaction(async (tx) => {
        // Lecturas
        const ticket = await repository.findTicketById(ticketId, tx)

        if (!ticket) {
            throw ticketNotFound()
        }

        if (counterId && !(await repository.findCounterById(counterId, tx))) {
            throw counterNotFound()
        }

        // Validación
        if (!canTransition(ticket.status, to)) {
            throw invalidTransition(ticket.status, to)
        }

        // Escrituras
        const at = new Date()

        repository.updateTicket(ticketId, { status: to, [timeField]: at }, tx)
        repository.recordEvent({
            ticketId,
            serviceId: ticket.serviceId,
            type,
            from: ticket.status,
            to,
            counterId: counterId ?? ticket.counterId,
            operatorId: auth.userId
        }, tx)

        return {
            ...ticket,
            status: to,
            [timeField]: at.toISOString()
        }
    })
}

export function startTicket(ticketId, body, auth) {
    return changeStatus('start', ticketId, body, auth)
}

export function finishTicket(ticketId, body, auth) {
    return changeStatus('finish', ticketId, body, auth)
}

export function cancelTicket(ticketId, body, auth) {
    return changeStatus('cancel', ticketId, body, auth)
}

// Ticket que el módulo está atendiendo (llamado o en atención); null si está libre
export async function getCounterTicket(counterId) {
    const counter = await repository.findCounterById(counterId)

    if (!counter) {
        throw counterNotFound()
    }

    return repository.findActiveByCounter(counterId, buildDayKey())
}