import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '../src/modules/auth/auth.schema.js'

describe('registerSchema', () => {
    it('acepta datos válidos y normaliza el correo', () => {
        const result = registerSchema.parse({
            body: {
                name: 'Ana López',
                email: '  ANA@FilaCero.TEST ',
                password: 'Secreta123'
            },
            params: {},
            query: {}
        })

        expect(result.body.email).toBe('ana@filacero.test')
    })

    it('rechaza una contraseña de menos de 8 caracteres', () => {
        expect(() => registerSchema.parse({
            body: {
                name: 'Ana López',
                email: 'ana@filacero.test',
                password: '123'
            },
            params: {},
            query: {}
        })).toThrow()
    })

    it('rechaza un correo inválido', () => {
        expect(() => registerSchema.parse({
            body: {
                name: 'Ana López',
                email: 'no-es-correo',
                password: 'Secreta123'
            },
            params: {},
            query: {}
        })).toThrow()
    })
})

describe('loginSchema', () => {
    it('rechaza el login sin contraseña', () => {
        expect(() => loginSchema.parse({
            body: { email: 'admin@filacero.test', password: '' },
            params: {},
            query: {}
        })).toThrow()
    })
})
