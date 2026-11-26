import { z } from 'zod'

const idParamsSchema = z.object({
    id: z
        .string({ error: 'El id es obligatorio' })
        .trim()
        .min(1, 'El id es obligatorio')
        .regex(/^[a-zA-Z0-9_-]+$/, 'El id contiene caracteres inválidos')
})

const optionalText = (max, label) => z
    .string({ error: `${label} debe ser texto` })
    .trim()
    .max(max, `${label} debe tener como máximo ${max} caracteres`)

export const getOrganizationSchema = z.object({
    params: idParamsSchema
})

export const updateOrganizationSchema = z.object({
    params: idParamsSchema,
    body: z
        .object({
            name: z
                .string({ error: 'El nombre es obligatorio' })
                .trim()
                .min(2, 'El nombre debe tener al menos 2 caracteres')
                .max(80, 'El nombre debe tener como máximo 80 caracteres')
                .optional(),
            address: optionalText(160, 'La dirección').optional(),
            schedule: optionalText(120, 'El horario').optional(),
            message: optionalText(280, 'El mensaje').optional()
        })
        .refine(
            (body) => Object.values(body).some((value) => value !== undefined),
            'Debe enviar al menos un campo para actualizar'
        )
})
