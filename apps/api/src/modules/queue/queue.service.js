import { AppError } from '../../shared/errors/app-errors.js'
import { buildDayKey } from '../tickets/tickets.utils.js'
import { estimateWaitTime } from './queue.estimator.js'
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

    const [waiting, serviceDoc, recentFinished, activeCounters] = await Promise.all([
        repository.findWaiting(ticket.serviceId, ticket.dayKey),
        ticket.serviceName ? null : repository.findServiceById(ticket.serviceId),
        repository.findRecentFinished(ticket.serviceId, 10),
        repository.findActiveCountersByServiceId(ticket.serviceId)
    ])

    // Resiliencia con tickets de R1 que no traen serviceName en el documento
    const serviceName = ticket.serviceName ?? serviceDoc?.name ?? 'General'
    const ahead = calculateAhead(ticket, waiting)

    let counterName = ticket.counterName ?? null
    if (ticket.counterId && !counterName) {
        const counter = await repository.findCounterById(ticket.counterId)
        counterName = counter?.name ?? `Módulo ${ticket.counterId}`
    }

    const activeCountersCount = Math.max(1, activeCounters?.length ?? 1)
    const estimation = estimateWaitTime({
        ahead,
        activeCounters: activeCountersCount,
        recentTickets: recentFinished
    })

    return {
        id: ticket.id,
        code: ticket.code,
        serviceName,
        status: ticket.status,
        ahead,
        counterId: ticket.counterId ?? null,
        counterName,
        estimatedMinutes: estimation.estimatedMinutes,
        isDefault: estimation.isDefault,
        ticketsSampled: estimation.ticketsSampled,
        estimatedWaitTimeMinutes: estimation.estimatedMinutes,
        isDefaultEstimate: estimation.isDefault,
        ticketsUsed: estimation.ticketsSampled
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
    const [waiting, inProgress, recentFinished, activeCounters] = await Promise.all([
        repository.findWaiting(serviceId, dayKey),
        repository.findInProgress(serviceId, dayKey),
        repository.findRecentFinished(serviceId, 10),
        repository.findActiveCountersByServiceId(serviceId)
    ])

    // El turno actual es el último llamado (el de número más alto en CALLED / IN_SERVICE)
    const currentTicket = inProgress.at(-1)
    let currentCounterName = null
    if (currentTicket?.counterId) {
        const counter = await repository.findCounterById(currentTicket.counterId)
        currentCounterName = counter?.name ?? `Módulo ${currentTicket.counterId}`
    }

    const activeCountersCount = Math.max(1, activeCounters?.length ?? 1)
    const estimation = estimateWaitTime({
        ahead: waiting.length,
        activeCounters: activeCountersCount,
        recentTickets: recentFinished
    })

    return {
        serviceId,
        dayKey,
        current: currentTicket
            ? {
                id: currentTicket.id,
                code: currentTicket.code,
                counterId: currentTicket.counterId,
                counterName: currentCounterName
            }
            : null,
        waiting,
        estimatedMinutes: estimation.estimatedMinutes,
        isDefault: estimation.isDefault,
        ticketsSampled: estimation.ticketsSampled,
        estimatedWaitTimeMinutes: estimation.estimatedMinutes,
        isDefaultEstimate: estimation.isDefault,
        ticketsUsed: estimation.ticketsSampled
    }
}
