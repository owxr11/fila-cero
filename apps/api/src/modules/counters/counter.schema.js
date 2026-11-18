import { z } from 'zod'

const counterNameSchema = z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre debe tener como máximo 60 caracteres')

const serviceIdsSchema = z
    .array(z.string().trim().min(1, 'El id del servicio no puede estar vacío'), {
        error: 'serviceIds debe ser una lista de ids de servicios'
    })
    .min(1, 'El módulo debe atender al menos un servicio')
    .max(26, 'El módulo puede atender como máximo 26 servicios')
    .transform((ids) => [...new Set(ids)])

const idParamsSchema = z.object({
    id: z.string().trim().min(1, 'El id es obligatorio')
})

export const listCountersSchema = z.object({
    query: z.object({
        active: z.enum(['true', 'false']).optional()
    })
})

export const createCounterSchema = z.object({
    body: z.object({
        name: counterNameSchema,
        serviceIds: serviceIdsSchema,
        active: z.boolean().default(true)
    })
})

export const updateCounterSchema = z.object({
    params: idParamsSchema,
    body: z
        .object({
            name: counterNameSchema.optional(),
            serviceIds: serviceIdsSchema.optional(),
            active: z.boolean().optional()
        })
        .refine(
            (body) => Object.values(body).some((value) => value !== undefined),
            'Debe enviar al menos un campo para actualizar'
        )
})
