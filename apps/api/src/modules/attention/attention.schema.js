import { z } from 'zod'

const idSchema = (name) => z
    .string({ error: `El parámetro ${name} es requerido` })
    .trim()
    .min(1, `El parámetro ${name} no puede estar vacío`)
    .regex(/^[a-zA-Z0-9_-]+$/, `El parámetro ${name} contiene caracteres inválidos`)

export const callNextSchema = z.object({
    body: z.object({
        counterId: idSchema('counterId')
    })
})

// counterId es opcional: indica desde qué módulo se hace el cambio (se guarda en serviceEvents)
export const ticketActionSchema = z.object({
    params: z.object({
        ticketId: idSchema('ticketId')
    }),
    body: z.object({
        counterId: idSchema('counterId').optional()
    })
})

export const getCounterTicketSchema = z.object({
    params: z.object({
        counterId: idSchema('counterId')
    })
})