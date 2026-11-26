import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/modules/history/history.repository.js', () => ({
    findTickets: vi.fn()
}))

vi.mock('../src/modules/services/service.repository.js', () => ({
    findAll: vi.fn(),
    findById: vi.fn(),
    findManyByIds: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
}))

vi.mock('../src/modules/counters/counter.repository.js', () => ({
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
}))

vi.mock('../src/modules/organizations/organization.repository.js', () => ({
    findById: vi.fn(),
    update: vi.fn()
}))

const historyRepository = await import('../src/modules/history/history.repository.js')
const serviceRepository = await import('../src/modules/services/service.repository.js')
const counterRepository = await import('../src/modules/counters/counter.repository.js')
const organizationRepository = await import('../src/modules/organizations/organization.repository.js')
const { app } = await import('../src/app.js')
const { signAccessToken } = await import('../src/shared/security/tokens.js')
const { historyFiltersSchema } = await import('../src/modules/history/history.schema.js')

const bearer = (role) => `Bearer ${signAccessToken({ sub: `${role.toLowerCase()}-1`, role })}`

const organization = {
    id: 'demo',
    name: 'FilaCero Demo',
    address: 'Av. Siempre Viva 123',
    schedule: 'Lunes a viernes de 9:00 a 17:00',
    message: 'Bienvenido',
    active: true,
    updatedAt: null
}

beforeEach(() => {
    vi.resetAllMocks()
    serviceRepository.findAll.mockResolvedValue([{ id: 's1', name: 'Caja', prefix: 'A' }])
    counterRepository.findAll.mockResolvedValue([{ id: 'm1', name: 'Módulo 1', serviceIds: ['s1'] }])
})

describe('filtros del historial', () => {
    it.each([
        ['fecha con otro formato', { date: '25/11/2026' }, 'date'],
        ['fecha que no existe', { date: '2026-02-30' }, 'date'],
        ['estado desconocido', { status: 'PERDIDO' }, 'status'],
        ['serviceId vacío', { serviceId: '' }, 'serviceId'],
        ['counterId con caracteres inválidos', { counterId: 'm1/../x' }, 'counterId']
    ])('rechaza %s', (_case, query, field) => {
        const result = historyFiltersSchema.safeParse({ query })

        expect(result.success).toBe(false)
        expect(result.error.issues[0].path).toEqual(['query', field])
    })

    it('acepta filtros válidos y la fecha es opcional', () => {
        expect(historyFiltersSchema.safeParse({ query: {} }).success).toBe(true)
        expect(historyFiltersSchema.safeParse({
            query: { date: '2026-11-25', serviceId: 's1', counterId: 'm1', status: 'DONE' }
        }).success).toBe(true)
    })

    it('GET /history responde 400 con una fecha inválida', async () => {
        const response = await request(app)
            .get('/api/v1/history?date=2026-13-01')
            .set('Authorization', bearer('ADMIN'))

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
})

describe('permisos del historial', () => {
    it.each(['/api/v1/history', '/api/v1/history/summary'])('%s responde 401 sin token', async (url) => {
        const response = await request(app).get(url)

        expect(response.status).toBe(401)
    })

    it.each(['/api/v1/history', '/api/v1/history/summary'])('%s responde 403 a un VISITOR', async (url) => {
        const response = await request(app).get(url).set('Authorization', bearer('VISITOR'))

        expect(response.status).toBe(403)
        expect(historyRepository.findTickets).not.toHaveBeenCalled()
    })

    it.each(['OPERATOR', 'ADMIN'])('%s puede ver el historial con nombres y tiempos', async (role) => {
        historyRepository.findTickets.mockResolvedValue([{
            id: 't1',
            serviceId: 's1',
            serviceName: null,
            number: 1,
            code: 'A-001',
            dayKey: '2026-11-25',
            status: 'DONE',
            counterId: 'm1',
            createdAt: '2026-11-25T15:00:00.000Z',
            calledAt: '2026-11-25T15:10:00.000Z',
            startedAt: '2026-11-25T15:11:00.000Z',
            finishedAt: '2026-11-25T15:16:00.000Z',
            cancelledAt: null
        }])

        const response = await request(app)
            .get('/api/v1/history?date=2026-11-25&status=DONE')
            .set('Authorization', bearer(role))

        expect(response.status).toBe(200)
        expect(historyRepository.findTickets).toHaveBeenCalledWith({ date: '2026-11-25', status: 'DONE' })
        expect(response.body.data[0]).toMatchObject({
            serviceName: 'Caja',
            counterName: 'Módulo 1',
            waitMinutes: 10,
            attentionMinutes: 5
        })
    })

    it('GET /history/summary agrupa por módulo', async () => {
        historyRepository.findTickets.mockResolvedValue([
            { status: 'DONE', counterId: 'm1', startedAt: '2026-11-25T15:00:00.000Z', finishedAt: '2026-11-25T15:06:00.000Z' },
            { status: 'CANCELLED', counterId: 'm1' }
        ])

        const response = await request(app)
            .get('/api/v1/history/summary?date=2026-11-25')
            .set('Authorization', bearer('OPERATOR'))

        expect(response.status).toBe(200)
        expect(response.body.data.counters).toEqual([
            { counterId: 'm1', counterName: 'Módulo 1', attended: 1, cancelled: 1, averageAttentionMinutes: 6 }
        ])
    })
})

describe('establecimiento', () => {
    it('GET /organizations/demo es público', async () => {
        organizationRepository.findById.mockResolvedValue(organization)

        const response = await request(app).get('/api/v1/organizations/demo')

        expect(response.status).toBe(200)
        expect(response.body.data.message).toBe('Bienvenido')
    })

    it('GET /organizations/otra responde 404', async () => {
        organizationRepository.findById.mockResolvedValue(null)

        const response = await request(app).get('/api/v1/organizations/otra')

        expect(response.status).toBe(404)
        expect(response.body.error.code).toBe('ORGANIZATION_NOT_FOUND')
    })

    it.each([
        ['sin token', undefined, 401],
        ['OPERATOR', 'OPERATOR', 403],
        ['VISITOR', 'VISITOR', 403]
    ])('PATCH /organizations/demo %s responde %s', async (_case, role, status) => {
        const call = request(app).patch('/api/v1/organizations/demo').send({ message: 'Hola' })
        const response = role ? await call.set('Authorization', bearer(role)) : await call

        expect(response.status).toBe(status)
        expect(organizationRepository.update).not.toHaveBeenCalled()
    })

    it('PATCH /organizations/demo lo edita un ADMIN', async () => {
        organizationRepository.findById.mockResolvedValue(organization)
        organizationRepository.update.mockResolvedValue({ ...organization, schedule: 'Sábados de 9:00 a 13:00' })

        const response = await request(app)
            .patch('/api/v1/organizations/demo')
            .set('Authorization', bearer('ADMIN'))
            .send({ schedule: '  Sábados de 9:00 a 13:00  ' })

        expect(response.status).toBe(200)
        expect(organizationRepository.update).toHaveBeenCalledWith('demo', { schedule: 'Sábados de 9:00 a 13:00' })
    })

    it('PATCH /organizations/demo responde 400 sin campos o con nombre corto', async () => {
        for (const body of [{}, { name: 'X' }]) {
            const response = await request(app)
                .patch('/api/v1/organizations/demo')
                .set('Authorization', bearer('ADMIN'))
                .send(body)

            expect(response.status).toBe(400)
        }
    })
})
