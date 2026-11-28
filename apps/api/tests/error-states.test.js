import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// Este archivo prueba la API como en producción: con límite de peticiones y CORS restringido
process.env.RATE_LIMIT_ENABLED = 'true'
process.env.CORS_ORIGIN = 'http://localhost:3000, https://filacero.example.app/'

vi.mock('../src/modules/users/user.repository.js', () => ({
    listUsers: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn()
}))

vi.mock('../src/modules/tickets/tickets.service.js', () => ({
    createTicket: vi.fn(async () => ({ id: 't-1', code: 'A-001' }))
}))

const userRepository = await import('../src/modules/users/user.repository.js')
const { app } = await import('../src/app.js')
const { signAccessToken } = await import('../src/shared/security/tokens.js')

const API = '/api/v1'
const admin = `Bearer ${signAccessToken({ sub: 'admin-1', role: 'ADMIN' })}`

describe('estados de error', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('400 con JSON mal formado, sin mostrar el error interno del parser', async () => {
        const response = await request(app)
            .post(`${API}/auth/login`)
            .set('Content-Type', 'application/json')
            .send('{"email": ')

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('INVALID_JSON')
        expect(response.body.error.message).not.toMatch(/position|token|JSON\.parse/i)
    })

    it('413 si el cuerpo es demasiado grande', async () => {
        const response = await request(app)
            .post(`${API}/auth/login`)
            .send({ email: 'a@a.com', password: 'x'.repeat(2 * 1024 * 1024) })

        expect(response.status).toBe(413)
        expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE')
    })

    it('404 con formato estándar en una ruta que no existe', async () => {
        const response = await request(app).get(`${API}/no-existe`)

        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(response.body.meta.requestId).toBeTypeOf('string')
    })

    it('500 sin filtrar el mensaje ni la pila del error real', async () => {
        userRepository.listUsers.mockRejectedValue(new Error('7 PERMISSION_DENIED: clave de Firestore secreta'))

        const response = await request(app).get(`${API}/users`).set('Authorization', admin)

        expect(response.status).toBe(500)
        expect(response.body.error).toEqual({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor'
        })
        expect(JSON.stringify(response.body)).not.toMatch(/PERMISSION_DENIED|secreta|stack/)
    })
})

describe('cabeceras de seguridad y CORS', () => {
    it('usa helmet y no revela que es Express', async () => {
        const response = await request(app).get(`${API}/health`)

        expect(response.headers['x-powered-by']).toBeUndefined()
        expect(response.headers['x-content-type-options']).toBe('nosniff')
    })

    it.each([
        'http://localhost:3000',
        'https://filacero.example.app'
    ])('permite el origen configurado %s', async (origin) => {
        const response = await request(app).get(`${API}/health`).set('Origin', origin)
        expect(response.headers['access-control-allow-origin']).toBe(origin)
    })

    it('no permite un origen desconocido', async () => {
        const response = await request(app).get(`${API}/health`).set('Origin', 'https://sitio-malo.com')
        expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
})

describe('límite de peticiones (429)', () => {
    it('bloquea el login después de 10 intentos fallidos desde la misma IP', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue(null)
        const attempt = () => request(app)
            .post(`${API}/auth/login`)
            .set('X-Forwarded-For', '203.0.113.10')
            .send({ email: 'nadie@filacero.test', password: 'incorrecta' })

        for (let i = 0; i < 10; i++) {
            expect((await attempt()).status).toBe(401)
        }

        const blocked = await attempt()
        expect(blocked.status).toBe(429)
        expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS')
    })

    it('bloquea la emisión de turnos después de 30 en 10 minutos', async () => {
        const issue = () => request(app).post(`${API}/tickets`).send({ serviceId: 's-1', clientId: crypto.randomUUID() })

        const statuses = []
        for (let i = 0; i < 31; i++) {
            statuses.push((await issue()).status)
        }

        expect(statuses.slice(0, 30).every((status) => status !== 429)).toBe(true)
        expect(statuses.at(-1)).toBe(429)
    })

    it('no limita las rutas que no son login, registro ni emisión', async () => {
        const response = await request(app).get(`${API}/health`)
        expect(response.status).toBe(200)
    })
})
