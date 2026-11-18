import { beforeEach, describe, expect, it, vi } from 'vitest'

// Se simulan los repositorios para no tocar Firestore en las pruebas
vi.mock('../src/modules/users/user.repository.js', () => ({
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findById: vi.fn(),
    createUser: vi.fn()
}))

vi.mock('../src/modules/auth/auth.repository.js', () => ({
    saveRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn()
}))

const userRepository = await import('../src/modules/users/user.repository.js')
const authService = await import('../src/modules/auth/auth.service.js')
const { hashPassword } = await import('../src/shared/security/password.js')
const { verifyAccessToken } = await import('../src/shared/security/tokens.js')

const storedUser = {
    id: 'user-1',
    name: 'Operador Demo',
    email: 'operador@filacero.test',
    role: 'OPERATOR',
    active: true
}

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('register crea siempre el rol VISITOR', async () => {
        userRepository.findByEmail.mockResolvedValue(null)
        userRepository.createUser.mockImplementation(async (data) => ({
            id: 'nuevo',
            name: data.name,
            email: data.email,
            role: data.role,
            active: data.active
        }))

        const result = await authService.register({
            name: 'Ana',
            email: 'ana@filacero.test',
            password: 'Secreta123'
        })

        expect(userRepository.createUser.mock.calls[0][0].role).toBe('VISITOR')
        expect(result.user.role).toBe('VISITOR')
        expect(result.accessToken).toBeTypeOf('string')
    })

    it('register responde 409 si el correo ya existe', async () => {
        userRepository.findByEmail.mockResolvedValue(storedUser)

        await expect(authService.register({
            name: 'Otro',
            email: storedUser.email,
            password: 'Secreta123'
        })).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_EXISTS' })
    })

    it('login devuelve el usuario sin passwordHash y un token con su rol', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue({
            ...storedUser,
            passwordHash: await hashPassword('Operador12345')
        })

        const result = await authService.login({
            email: storedUser.email,
            password: 'Operador12345'
        })

        expect(result.user).not.toHaveProperty('passwordHash')
        expect(verifyAccessToken(result.accessToken).role).toBe('OPERATOR')
    })

    it('login responde 401 con contraseña incorrecta', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue({
            ...storedUser,
            passwordHash: await hashPassword('Operador12345')
        })

        await expect(authService.login({
            email: storedUser.email,
            password: 'incorrecta'
        })).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' })
    })

    it('login responde 401 si el usuario está desactivado', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue({
            ...storedUser,
            active: false,
            passwordHash: await hashPassword('Operador12345')
        })

        await expect(authService.login({
            email: storedUser.email,
            password: 'Operador12345'
        })).rejects.toMatchObject({ statusCode: 401 })
    })
})
