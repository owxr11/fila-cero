import { z } from 'zod'

const empty = z.object({}).default({})

const email = z.string().trim().toLowerCase().email('Correo inválido')
const password = z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga')

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'El nombre es muy corto').max(120),
        email,
        password
    }),
    params: empty,
    query: empty
})

export const loginSchema = z.object({
    body: z.object({
        email,
        password: z.string().min(1, 'La contraseña es requerida')
    }),
    params: empty,
    query: empty
})

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1)
    }),
    params: empty,
    query: empty
})

export const meSchema = z.object({
    body: empty,
    params: empty,
    query: empty
})
