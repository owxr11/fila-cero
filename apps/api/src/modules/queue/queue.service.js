import { AppError } from '../../shared/errors/app-errors.js'
import { buildDayKey } from '../tickets/tickets.utils.js'
import * as repository from './queue.repository.js'
import { calculateAhead } from './queue.utils.js'

export async function getTicketStatus(id) {
    const ticket = await repository.findTicketById(id)

    if (!ticket) {
        throw new AppError({
            statusCode: 404,
            code: 'TICKET_NOT_FOUND',
            message: 'Ticket no encontrado'
        })
    }

    const waiting = await repository.findWaiting(ticket.serviceId, ticket.dayKey)
    const serviceName = ticket.serviceName ?? (await repository.findServiceById(ticket.serviceId))?.name ?? null

    return {
        id: ticket.id,
        code: ticket.code,
        serviceName,
        status: ticket.status,
        ahead: calculateAhead(ticket, waiting)
    }
}

export async function getQueue({ serviceId }) {
    const service = await repository.findServiceById(serviceId)

    if (!service) {
        throw new AppError({
            statusCode: 404,
            code: 'SERVICE_NOT_FOUND',
            message: 'Servicio no encontrado'
        })
    }

    const dayKey = buildDayKey()
    const [waiting, inProgress] = await Promise.all([
        repository.findWaiting(serviceId, dayKey),
        repository.findInProgress(serviceId, dayKey)
    ])

    // El turno actual es el último llamado (el de número más alto en CALLED / IN_SERVICE)
    const currentTicket = inProgress.at(-1)

    return {
        serviceId,
        dayKey,
        current: currentTicket
            ? { id: currentTicket.id, code: currentTicket.code, counterId: currentTicket.counterId }
            : null,
        waiting
    }
}
