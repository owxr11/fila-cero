import * as service from './tickets.service.js';
import { AppError } from '../../shared/errors/app-errors.js';

export async function create(req, res, next) {
    try {
        const { serviceId } = req.body;

        if (!serviceId) {
            throw new AppError('El campo serviceId es obligatorio', 400);
        }

        const ticket = await service.createTicket({ serviceId });
        res.status(201).json({ data: ticket })
    } catch (e) {
        next(e);
    }
}
