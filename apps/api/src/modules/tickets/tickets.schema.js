import { z } from 'zod'

export const createTicketSchema = z.object({
    body: z.object({
        serviceId: z
            .string({ error: 'El serviceId es obligatorio' })
            .trim()
            .min(1, 'El serviceId es obligatorio'),
        clientId: z
            .string({ error: 'El clientId es obligatorio' })
            .trim()
            .min(8, 'El clientId debe tener al menos 8 caracteres')
            .max(100, 'El clientId debe tener como máximo 100 caracteres')
            .regex(/^[A-Za-z0-9_-]+$/, 'El clientId solo puede tener letras, números, guion y guion bajo')
    })
})
