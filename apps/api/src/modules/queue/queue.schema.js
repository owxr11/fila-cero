import { z }    from 'zod'

const idParamsSchema = z.object({
    id: z
    .string({error: 'El parámetro id es requerido'})
    .trim()
    .min(1, 'El parámetro id no puede estar vacío')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El parámetro id contiene caracteres inválidos')
})

export const getTicketStatusSchema = z.object({
    params: idParamsSchema
})

export const getQueueSchema = z.object({
    query: z.object({
        serviceId: z
        .string({error: 'El parámetro serviceId es requerido'})
        .trim()
        .min(1, 'El parámetro serviceId no puede estar vacío')

        .regex(/^[a-zA-Z0-9_-]+$/, 'El parámetro serviceId contiene caracteres inválidos'),
    })
})