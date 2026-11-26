import { z } from 'zod'
import { ROLES } from '../../config/permissions.js'
import { email, password } from '../auth/auth.schema.js'

const name = z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre es muy corto')
    .max(120, 'El nombre es demasiado largo')

const role = z.enum(Object.values(ROLES), { error: 'El rol no es válido' })

export const listUsersSchema = z.object({
    query: z.object({
        role: role.optional()
    })
})

// Los VISITOR se registran solos en /auth/register
export const createUserSchema = z.object({
    body: z.object({
        name,
        email,
        password,
        role: z.enum([ROLES.OPERATOR, ROLES.ADMIN], {
            error: 'El rol debe ser OPERATOR o ADMIN'
        })
    })
})

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string()
            .trim()
            .min(1, 'El id es obligatorio')
            .regex(/^[a-zA-Z0-9_-]+$/, 'El id contiene caracteres inválidos')
    }),
    body: z
        .object({
            name: name.optional(),
            role: role.optional(),
            active: z.boolean().optional()
        })
        .refine(
            (body) => Object.values(body).some((value) => value !== undefined),
            'Debe enviar al menos un campo para actualizar'
        )
})
