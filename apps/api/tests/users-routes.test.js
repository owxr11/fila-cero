import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// Se simulan los repositorios para no tocar Firestore en las pruebas
vi.mock('../src/modules/users/user.repository.js', () => ({
    listUsers: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn()
}))

vi.mock('../src/modules/auth/auth.repository.js', () => ({
    saveRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn()
}))

const repository = await import('../src/modules/users/user.repository.js')
const authRepository = await import('../src/modules/auth/auth.repository.js')
const { app } = await import('../src/app.js')
const { signAccessToken, signRefreshToken } = await import('../src/shared/security/tokens.js')

const URL = '/api/v1/users'
const bearer = (role) => `Bearer ${signAccessToken({ sub: 'admin-1', role })}`

const admin = { id: 'admin-1', name: 'Admin Demo', email: 'admin@filacero.test', role: 'ADMIN', active: true }
const operator = { id: 'op-1', name: 'Operador Demo', email: 'operador@filacero.test', role: 'OPERATOR', active: true }
const newOperator = { name: 'Operador Dos', email: 'Operador2@FilaCero.test', password: 'Operador12345', role: 'OPERATOR' }

const endpoints = [
    ['get', URL],
    ['post', URL],
    ['patch', `${URL}/op-1`]
]

beforeEach(() => {
    vi.resetAllMocks()
})

describe('permisos de /users', () => {
    it.each(endpoints)('%s %s responde 401 sin token', async (method, url) => {
        const response = await request(app)[method](url)
        expect(response.status).toBe(401)
    })

    it.each(endpoints)('%s %s responde 403 a VISITOR y OPERATOR', async (method, url) => {
        for (const role of ['VISITOR', 'OPERATOR']) {
            const response = await request(app)[method](url).set('Authorization', bearer(role))
            expect(response.status).toBe(403)
        }
    })

    it('ADMIN lista usuarios filtrando por rol', async () => {
        repository.listUsers.mockResolvedValue([admin])

        const response = await request(app).get(`${URL}?role=ADMIN`).set('Authorization', bearer('ADMIN'))

        expect(response.status).toBe(200)
        expect(response.body.meta.count).toBe(1)
        expect(repository.listUsers).toHaveBeenCalledWith({ role: 'ADMIN' })
    })
})

describe('alta de usuarios', () => {
    const post = (body) => request(app).post(URL).set('Authorization', bearer('ADMIN')).send(body)

    it('crea un operador con el correo en minúsculas y la contraseña cifrada', async () => {
        repository.findByEmail.mockResolvedValue(null)
        repository.createUser.mockResolvedValue({ id: 'op-2' })

        const response = await post(newOperator)
        const saved = repository.createUser.mock.calls[0][0]

        expect(response.status).toBe(201)
        expect(saved.email).toBe('operador2@filacero.test')
        expect(saved.role).toBe('OPERATOR')
        expect(saved).not.toHaveProperty('password')
        expect(saved.passwordHash).not.toBe(newOperator.password)
    })

    it('responde 409 si el correo ya existe', async () => {
        repository.findByEmail.mockResolvedValue(operator)

        const response = await post(newOperator)

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('EMAIL_EXISTS')
    })

    it.each([
        ['rol VISITOR', { role: 'VISITOR' }],
        ['contraseña corta', { password: '123' }],
        ['correo inválido', { email: 'correo' }]
    ])('responde 400 con %s', async (_case, change) => {
        const response = await post({ ...newOperator, ...change })
        expect(response.status).toBe(400)
    })
})

describe('edición de usuarios', () => {
    const patch = (id, body) => request(app).patch(`${URL}/${id}`).set('Authorization', bearer('ADMIN')).send(body)

    it.each([
        ['desactivarse', { active: false }, 'CANNOT_DISABLE_SELF'],
        ['quitarse el rol', { role: 'OPERATOR' }, 'CANNOT_CHANGE_OWN_ROLE']
    ])('el admin no puede %s', async (_case, body, code) => {
        repository.findById.mockResolvedValue(admin)

        const response = await patch(admin.id, body)

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe(code)
        expect(repository.updateUser).not.toHaveBeenCalled()
    })

    it('desactiva a otro usuario', async () => {
        repository.findById.mockResolvedValue(operator)
        repository.updateUser.mockResolvedValue({ ...operator, active: false })

        const response = await patch(operator.id, { active: false })

        expect(response.status).toBe(200)
        expect(repository.updateUser).toHaveBeenCalledWith(operator.id, { active: false })
    })

    it('responde 404 si el usuario no existe', async () => {
        repository.findById.mockResolvedValue(null)
        const response = await patch('nadie', { active: false })
        expect(response.status).toBe(404)
    })

    it('responde 400 sin campos para actualizar', async () => {
        const response = await patch(operator.id, {})
        expect(response.status).toBe(400)
    })
})

describe('usuario desactivado', () => {
    it('no puede renovar su sesión', async () => {
        const refreshToken = signRefreshToken({ sub: operator.id, role: 'OPERATOR' })
        authRepository.findRefreshToken.mockResolvedValue({ userId: operator.id, revoked: false })
        repository.findById.mockResolvedValue({ ...operator, active: false })

        const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken })

        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('USER_DISABLED')
    })
})
