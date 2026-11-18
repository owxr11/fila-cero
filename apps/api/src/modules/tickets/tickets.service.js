import { createTicketTransaction } from "./tickets.repository.js";
import { AppError, } from "../../shared/errors/app-errors.js";

export async function createTicket({ serviceId }) {
    try {
        const result = await createTicketTransaction(serviceId);

        if (result.error === 'NOT_FOUND') {
            throw new AppError('El servicio no existe', 404);
        }

        if (result.error === 'INACTIVE') {
            throw new AppError('El servicio no está activo actualmente', 400);
        }

        return result.ticket;
    } catch (error) {
        if (error instanceof AppError) throw error;

        throw new AppError(error.message || 'Error al crear el ticket', 500);
    }
}
