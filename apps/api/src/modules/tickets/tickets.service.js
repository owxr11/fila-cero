import { createTicketTransaction } from './tickets.repository.js'
import { AppError } from '../../shared/errors/app-errors.js'

export async function createTicket({ serviceId, clientId }) {
    const result = await createTicketTransaction({ serviceId, clientId })

    if (result.error === 'SERVICE_NOT_FOUND') {
        throw new AppError({
            statusCode: 404,
            code: 'SERVICE_NOT_FOUND',
            message: 'Servicio no encontrado'
        })
    }

    if (result.error === 'SERVICE_INACTIVE') {
        throw new AppError({
            statusCode: 409,
            code: 'SERVICE_INACTIVE',
            message: 'El servicio no está activo actualmente'
        })
    }

    if (result.error === 'ACTIVE_TICKET_EXISTS') {
        throw new AppError({
            statusCode: 409,
            code: 'ACTIVE_TICKET_EXISTS',
            message: `Ya tienes el turno ${result.existing.code}`,
            details: { ticketId: result.existing.id, code: result.existing.code }
        })
    }

    return result.ticket
}
