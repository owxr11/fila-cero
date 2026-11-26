import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// La prueba no toca Firestore: se simula el repositorio y la configuración de Firebase
vi.mock('../src/config/firebase.js', () => ({
    db: { collection: () => ({}) },
    COLLECTIONS: {
        organizations: 'organizations',
        users: 'users',
        refreshTokens: 'refreshTokens',
        services: 'services',
        counters: 'counters',
        tickets: 'tickets',
        dailyStats: 'dailyStats',
        serviceEvents: 'serviceEvents'
    }
}))

vi.mock('../src/modules/queue/queue.repository.js', () => ({
    findTicketById: vi.fn().mockImplementation((id) => {
        if (id === 'ticket-123') {
            return Promise.resolve({
                id: 'ticket-123',
                serviceId: 'srv-1',
                serviceName: 'Caja',
                number: 5,
                code: 'A-005',
                dayKey: '2026-11-23',
                status: 'WAITING',
                counterId: null,
                counterName: null
            })
        }
        if (id === 'ticket-legacy') {
            // Ticket viejo de R1 sin orgId ni serviceName
            return Promise.resolve({
                id: 'ticket-legacy',
                serviceId: 'srv-1',
                serviceName: null,
                number: 5,
                code: 'A-005',
                dayKey: '2026-11-23',
                status: 'WAITING',
                counterId: null,
                counterName: null
            })
        }
        if (id === 'ticket-called') {
            return Promise.resolve({
                id: 'ticket-called',
                serviceId: 'srv-1',
                serviceName: 'Caja',
                number: 3,
                code: 'A-003',
                dayKey: '2026-11-23',
                status: 'CALLED',
                counterId: 'cnt-2',
                counterName: 'Módulo 2'
            })
        }
        return Promise.resolve(null)
    }),
    findServiceById: vi.fn().mockImplementation((id) => {
        if (id === 'srv-1') {
            return Promise.resolve({ id: 'srv-1', name: 'Caja' })
        }
        return Promise.resolve(null)
    }),
    findWaiting: vi.fn().mockResolvedValue([
        { id: 't-1', code: 'A-001', number: 1 },
        { id: 't-2', code: 'A-002', number: 2 },
        { id: 't-5', code: 'A-005', number: 5 }
    ]),
    findInProgress: vi.fn().mockResolvedValue([
        { id: 't-3', code: 'A-003', number: 3, counterId: 'cnt-2' }
    ]),
    findRecentFinished: vi.fn().mockResolvedValue([
        { durationMinutes: 6 },
        { durationMinutes: 4 }
    ]),
    findActiveCountersByServiceId: vi.fn().mockResolvedValue([
        { id: 'cnt-1', name: 'Módulo 1' },
        { id: 'cnt-2', name: 'Módulo 2' }
    ]),
    findCounterById: vi.fn().mockResolvedValue({ id: 'cnt-2', name: 'Módulo 2' })
}))

import { app } from '../src/app.js'
import { calculateAhead } from '../src/modules/queue/queue.utils.js'

describe('calculateAhead', () => {
    it('cuenta solo los WAITING con número menor y es 0 si el ticket ya no espera', () => {
        const waiting = [{ number: 2 }, { number: 4 }, { number: 5 }, { number: 9 }]

        expect(calculateAhead({ status: 'WAITING', number: 5 }, waiting)).toBe(2)
        expect(calculateAhead({ status: 'WAITING', number: 2 }, waiting)).toBe(0)
        expect(calculateAhead({ status: 'WAITING', number: 1 }, [])).toBe(0)
        expect(calculateAhead({ status: 'CALLED', number: 5 }, waiting)).toBe(0)
    })
})

describe('GET /api/v1/queue/tickets/:id', () => {
    it('responde 404 TICKET_NOT_FOUND si el ticket no existe', async () => {
        const response = await request(app).get('/api/v1/queue/tickets/ticket-que-no-existe')

        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(response.body.error.code).toBe('TICKET_NOT_FOUND')
    })

    it('incluye tiempo estimado, si salió de historial o default, y cuántos tickets se usaron', async () => {
        const response = await request(app).get('/api/v1/queue/tickets/ticket-123')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        const data = response.body.data

        expect(data.id).toBe('ticket-123')
        expect(data.code).toBe('A-005')
        expect(data.ahead).toBe(2) // Delante: ticket 1 y 2
        // Promedio de duraciones en mock: (6 + 4) / 2 = 5 min. 2 módulos activos -> 5 * 2 / 2 = 5 min
        expect(typeof data.estimatedMinutes).toBe('number')
        expect(data.estimatedMinutes).toBe(5)
        expect(data.isDefault).toBe(false)
        expect(data.ticketsSampled).toBe(2)
    })

    it('funciona correctamente con tickets viejos de R1 sin serviceName', async () => {
        const response = await request(app).get('/api/v1/queue/tickets/ticket-legacy')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        const data = response.body.data

        expect(data.id).toBe('ticket-legacy')
        expect(data.serviceName).toBe('Caja') // Resuelto desde findServiceById
        expect(data.ahead).toBe(2)
    })

    it('devuelve el módulo asignado cuando el ticket está en estado CALLED', async () => {
        const response = await request(app).get('/api/v1/queue/tickets/ticket-called')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        const data = response.body.data

        expect(data.status).toBe('CALLED')
        expect(data.counterName).toBe('Módulo 2')
    })
})

describe('GET /api/v1/queue', () => {
    it('responde 404 si el servicio no existe', async () => {
        const response = await request(app).get('/api/v1/queue?serviceId=inexistente')

        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(response.body.error.code).toBe('SERVICE_NOT_FOUND')
    })

    it('incluye los campos de estimación en la cola del servicio', async () => {
        const response = await request(app).get('/api/v1/queue?serviceId=srv-1')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        const data = response.body.data

        expect(data.serviceId).toBe('srv-1')
        expect(data.waiting).toHaveLength(3)
        expect(typeof data.estimatedMinutes).toBe('number')
        expect(typeof data.isDefault).toBe('boolean')
        expect(typeof data.ticketsSampled).toBe('number')
    })
})
