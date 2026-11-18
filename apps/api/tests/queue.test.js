// código nuevo
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
    findTicketById: vi.fn().mockResolvedValue(null),
    findServiceById: vi.fn(),
    findWaiting: vi.fn(),
    findInProgress: vi.fn()
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
})
