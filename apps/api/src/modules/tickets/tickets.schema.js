import { z } from 'zod'

export const createTicketSchema = z.object({
    body: z.object({
        serviceId: z
            .string({ error: 'El serviceId es obligatorio' })
            .trim()
            .min(1, 'El serviceId es obligatorio')
    })
})
