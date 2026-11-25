import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// La prueba no toca Firestore: se simula la configuración de Firebase y el repositorio
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

vi.mock('../src/modules/attention/attention.repository.js', () => ({
    runInTransaction: vi.fn(),
    findTicketById: vi.fn(),
    findCounterById: vi.fn(),
    findActiveByCounter: vi.fn(),
    findFirstWaitingByService: vi.fn(),
    updateTicket: vi.fn(),
    recordEvent: vi.fn()
}))

import { app } from '../src/app.js'
import * as repository from '../src/modules/attention/attention.repository.js'
import { ALLOWED_TRANSITIONS, canTransition, pickLowestNumber } from '../src/modules/attention/attention.utils.js'
import { signAccessToken } from '../src/shared/security/tokens.js'

const URL = '/api/v1/attention'
const bearer = (role) => `Bearer ${signAccessToken({ sub: 'user-1', role })}`

const STATUSES = ['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'CANCELLED']

const counter = { id: 'counter-1', name: 'Módulo 1', serviceIds: ['service-a', 'service-b'], active: true }
const ticketIn = (status, extra = {}) => ({
    id: 'ticket-1',
    serviceId: 'service-a',
    number: 5,
    code: 'A-005',
    dayKey: '2026-11-25',
    status,
    counterId: status === 'WAITING' ? null : 'counter-1',
    ...extra
})

beforeEach(() => {
    vi.resetAllMocks()
    // La transacción simulada ejecuta la operación una sola vez
    repository.runInTransaction.mockImplementation((operation) => operation({}))
})

describe('canTransition', () => {
    const valid = [
        ['WAITING', 'CALLED'],
        ['WAITING', 'CANCELLED'],
        ['CALLED', 'IN_SERVICE'],
        ['CALLED', 'CANCELLED'],
        ['IN_SERVICE', 'DONE']
    ]
    const allPairs = STATUSES.flatMap((from) => STATUSES.map((to) => [from, to]))
    const isValid = (from, to) => valid.some(([a, b]) => a === from && b === to)

    it.each(allPairs)('%s -> %s', (from, to) => {
        expect(canTransition(from, to)).toBe(isValid(from, to))
    })

    it('rechaza estados que no existen', () => {
        expect(canTransition('NO_EXISTE', 'CALLED')).toBe(false)
        expect(canTransition('WAITING', 'NO_EXISTE')).toBe(false)
        expect(canTransition('toString', 'CALLED')).toBe(false)
    })

    it('DONE y CANCELLED son estados finales', () => {
        expect(ALLOWED_TRANSITIONS.DONE).toEqual([])
        expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([])
    })
})

describe('pickLowestNumber', () => {
    it('elige el número más bajo y, en empate, el primero de la lista', () => {
        const first = { id: 'a', number: 1 }
        const second = { id: 'b', number: 1 }

        expect(pickLowestNumber([{ id: 'c', number: 3 }, first, second])).toBe(first)
        expect(pickLowestNumber([])).toBeNull()
    })
})

describe('permisos de /attention', () => {
    const endpoints = [
        ['post', `${URL}/call-next`],
        ['post', `${URL}/ticket-1/start`],
        ['post', `${URL}/ticket-1/finish`],
        ['post', `${URL}/ticket-1/cancel`],
        ['get', `${URL}/counter/counter-1`]
    ]

    it.each(endpoints)('%s %s responde 401 sin token', async (method, url) => {
        const response = await request(app)[method](url)

        expect(response.status).toBe(401)
    })

    it.each(endpoints)('%s %s responde 403 a un VISITOR', async (method, url) => {
        const response = await request(app)[method](url)
            .set('Authorization', bearer('VISITOR'))
            .send({ counterId: 'counter-1' })

        expect(response.status).toBe(403)
        expect(response.body.error.code).toBe('FORBIDDEN')
        expect(repository.runInTransaction).not.toHaveBeenCalled()
    })

    it.each(['OPERATOR', 'ADMIN'])('%s sí puede consultar el módulo', async (role) => {
        repository.findCounterById.mockResolvedValue(counter)
        repository.findActiveByCounter.mockResolvedValue(ticketIn('CALLED'))

        const response = await request(app)
            .get(`${URL}/counter/counter-1`)
            .set('Authorization', bearer(role))

        expect(response.status).toBe(200)
        expect(response.body.data.code).toBe('A-005')
    })
})

describe('POST /attention/call-next', () => {
    const callNext = (body = { counterId: 'counter-1' }) => request(app)
        .post(`${URL}/call-next`)
        .set('Authorization', bearer('OPERATOR'))
        .send(body)

    it('llama al ticket con el número más bajo y registra el evento', async () => {
        repository.findCounterById.mockResolvedValue(counter)
        repository.findActiveByCounter.mockResolvedValue(null)
        repository.findFirstWaitingByService.mockResolvedValue([
            ticketIn('WAITING', { id: 'ticket-9', serviceId: 'service-b', number: 9, code: 'B-009' }),
            ticketIn('WAITING', { id: 'ticket-2', serviceId: 'service-a', number: 2, code: 'A-002' })
        ])

        const response = await callNext()

        expect(response.status).toBe(200)
        expect(response.body.data).toMatchObject({ id: 'ticket-2', status: 'CALLED', counterId: 'counter-1' })
        expect(repository.findFirstWaitingByService).toHaveBeenCalledWith(counter.serviceIds, expect.any(String), {})
        expect(repository.updateTicket).toHaveBeenCalledWith(
            'ticket-2',
            { status: 'CALLED', counterId: 'counter-1', calledAt: expect.any(Date) },
            {}
        )
        expect(repository.recordEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                ticketId: 'ticket-2',
                type: 'CALLED',
                from: 'WAITING',
                to: 'CALLED',
                counterId: 'counter-1',
                operatorId: 'user-1'
            }),
            {}
        )
    })

    it('responde 409 COUNTER_BUSY si el módulo ya tiene un ticket activo', async () => {
        repository.findCounterById.mockResolvedValue(counter)
        repository.findActiveByCounter.mockResolvedValue(ticketIn('IN_SERVICE'))

        const response = await callNext()

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('COUNTER_BUSY')
        expect(repository.findFirstWaitingByService).not.toHaveBeenCalled()
        expect(repository.updateTicket).not.toHaveBeenCalled()
        expect(repository.recordEvent).not.toHaveBeenCalled()
    })

    it('responde 404 NO_WAITING_TICKETS si nadie espera', async () => {
        repository.findCounterById.mockResolvedValue(counter)
        repository.findActiveByCounter.mockResolvedValue(null)
        repository.findFirstWaitingByService.mockResolvedValue([])

        const response = await callNext()

        expect(response.status).toBe(404)
        expect(response.body.error.code).toBe('NO_WAITING_TICKETS')
        expect(repository.updateTicket).not.toHaveBeenCalled()
    })

    it('responde 404 si el módulo no existe y 409 si está desactivado', async () => {
        repository.findCounterById.mockResolvedValueOnce(null)
        expect((await callNext()).body.error.code).toBe('COUNTER_NOT_FOUND')

        repository.findCounterById.mockResolvedValueOnce({ ...counter, active: false })
        const response = await callNext()

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('COUNTER_INACTIVE')
    })

    it('responde 400 sin counterId', async () => {
        const response = await callNext({})

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
})

describe('cambios de estado de un ticket', () => {
    const act = (action, body = { counterId: 'counter-1' }) => request(app)
        .post(`${URL}/ticket-1/${action}`)
        .set('Authorization', bearer('OPERATOR'))
        .send(body)

    it.each([
        ['start', 'CALLED', 'IN_SERVICE', 'STARTED', 'startedAt'],
        ['finish', 'IN_SERVICE', 'DONE', 'FINISHED', 'finishedAt'],
        ['cancel', 'WAITING', 'CANCELLED', 'CANCELLED', 'cancelledAt'],
        ['cancel', 'CALLED', 'CANCELLED', 'CANCELLED', 'cancelledAt']
    ])('%s: de %s a %s guarda la hora y registra el evento', async (action, from, to, type, timeField) => {
        repository.findTicketById.mockResolvedValue(ticketIn(from))
        repository.findCounterById.mockResolvedValue(counter)

        const response = await act(action)

        expect(response.status).toBe(200)
        expect(response.body.data.status).toBe(to)
        expect(response.body.data[timeField]).toEqual(expect.any(String))
        expect(repository.updateTicket).toHaveBeenCalledWith(
            'ticket-1',
            { status: to, [timeField]: expect.any(Date) },
            {}
        )
        expect(repository.recordEvent).toHaveBeenCalledWith(
            expect.objectContaining({ type, from, to, counterId: 'counter-1', operatorId: 'user-1' }),
            {}
        )
    })

    it.each([
        ['start', 'WAITING'],
        ['start', 'IN_SERVICE'],
        ['start', 'DONE'],
        ['finish', 'WAITING'],
        ['finish', 'CALLED'],
        ['finish', 'CANCELLED'],
        ['cancel', 'IN_SERVICE'],
        ['cancel', 'DONE'],
        ['cancel', 'CANCELLED']
    ])('%s con el ticket en %s responde 409 INVALID_TRANSITION', async (action, status) => {
        repository.findTicketById.mockResolvedValue(ticketIn(status))
        repository.findCounterById.mockResolvedValue(counter)

        const response = await act(action)

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('INVALID_TRANSITION')
        expect(response.body.error.details).toMatchObject({ from: status })
        expect(repository.updateTicket).not.toHaveBeenCalled()
        expect(repository.recordEvent).not.toHaveBeenCalled()
    })

    it('responde 404 si el ticket no existe', async () => {
        repository.findTicketById.mockResolvedValue(null)

        const response = await act('start')

        expect(response.status).toBe(404)
        expect(response.body.error.code).toBe('TICKET_NOT_FOUND')
    })

    it('sin counterId en el body toma el módulo del ticket para el evento', async () => {
        repository.findTicketById.mockResolvedValue(ticketIn('CALLED'))

        const response = await act('start', {})

        expect(response.status).toBe(200)
        expect(repository.findCounterById).not.toHaveBeenCalled()
        expect(repository.recordEvent).toHaveBeenCalledWith(
            expect.objectContaining({ counterId: 'counter-1' }),
            {}
        )
    })
})

describe('GET /attention/counter/:counterId', () => {
    const get = () => request(app)
        .get(`${URL}/counter/counter-1`)
        .set('Authorization', bearer('OPERATOR'))

    it('devuelve null si el módulo está libre', async () => {
        repository.findCounterById.mockResolvedValue(counter)
        repository.findActiveByCounter.mockResolvedValue(null)

        const response = await get()

        expect(response.status).toBe(200)
        expect(response.body.data).toBeNull()
    })

    it('responde 404 si el módulo no existe', async () => {
        repository.findCounterById.mockResolvedValue(null)

        const response = await get()

        expect(response.status).toBe(404)
        expect(response.body.error.code).toBe('COUNTER_NOT_FOUND')
    })
})