import { z } from 'zod'

export const serviceNameSchema = z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre debe tener como máximo 60 caracteres')

export const servicePrefixSchema = z
    .string({ error: 'El prefijo es obligatorio' })
    .trim()
    .regex(/^[A-Z]$/, 'El prefijo debe ser una sola letra mayúscula (A-Z)')

const idParamsSchema = z.object({
    id: z.string().trim().min(1, 'El id es obligatorio')
})

export const listServicesSchema = z.object({
    query: z.object({
        active: z.enum(['true', 'false']).optional()
    })
})

export const getServiceSchema = z.object({
    params: idParamsSchema
})

export const createServiceSchema = z.object({
    body: z.object({
        name: serviceNameSchema,
        prefix: servicePrefixSchema,
        active: z.boolean().default(true)
    })
})

export const updateServiceSchema = z.object({
    params: idParamsSchema,
    body: z
        .object({
            name: serviceNameSchema.optional(),
            prefix: servicePrefixSchema.optional(),
            active: z.boolean().optional()
        })
        .refine(
            (body) => Object.values(body).some((value) => value !== undefined),
            'Debe enviar al menos un campo para actualizar'
        )
})
