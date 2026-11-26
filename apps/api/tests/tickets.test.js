import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/modules/tickets/tickets.repository.js', () => ({
    createTicketTransaction: vi.fn()
}))

import { createTicketTransaction } from '../src/modules/tickets/tickets.repository.js'
import { createTicket } from '../src/modules/tickets/tickets.service.js'
import { buildDayKey, formatTicketCode } from '../src/modules/tickets/tickets.utils.js'
import { createTicketSchema } from '../src/modules/tickets/tickets.schema.js'

const validBody = { serviceId: 'abc123', clientId: 'cliente-12345' }

describe('formatTicketCode', () => {
    it('rellena con ceros a 3 dígitos', () => {
        expect(formatTicketCode('A', 1)).toBe('A-001')
        expect(formatTicketCode('B', 42)).toBe('B-042')
        expect(formatTicketCode('C', 123)).toBe('C-123')
    })
})

describe('buildDayKey', () => {
    it('usa la zona horaria de México, no UTC', () => {
        expect(buildDayKey(new Date('2026-11-18T03:00:00Z'))).toBe('2026-11-17')
        expect(buildDayKey(new Date('2026-11-18T06:00:00Z'))).toBe('2026-11-18')
    })
})

describe('createTicketSchema', () => {
    it('acepta serviceId y clientId válidos', () => {
        expect(createTicketSchema.safeParse({ body: validBody }).success).toBe(true)
    })

    it('rechaza un body sin serviceId', () => {
        expect(createTicketSchema.safeParse({ body: { clientId: 'cliente-12345' } }).success).toBe(false)
    })

    it('rechaza un body sin clientId', () => {
        expect(createTicketSchema.safeParse({ body: { serviceId: 'abc123' } }).success).toBe(false)
    })

    it('rechaza un clientId muy corto o con caracteres raros', () => {
        expect(createTicketSchema.safeParse({ body: { serviceId: 'abc123', clientId: 'corto' } }).success).toBe(false)
        expect(createTicketSchema.safeParse({ body: { serviceId: 'abc123', clientId: 'tiene espacios!!' } }).success).toBe(false)
    })
})

describe('createTicket (service)', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('devuelve el ticket cuando se crea', async () => {
        createTicketTransaction.mockResolvedValue({ ticket: { id: 't1', code: 'A-001' } })

        await expect(createTicket(validBody)).resolves.toEqual({ id: 't1', code: 'A-001' })
    })

    it('rechaza con 409 ACTIVE_TICKET_EXISTS e incluye el ticket existente', async () => {
        createTicketTransaction.mockResolvedValue({
            error: 'ACTIVE_TICKET_EXISTS',
            existing: { id: 't1', code: 'A-007' }
        })

        await expect(createTicket(validBody)).rejects.toMatchObject({
            statusCode: 409,
            code: 'ACTIVE_TICKET_EXISTS',
            details: { ticketId: 't1', code: 'A-007' }
        })
    })

    it('responde 404 si el servicio no existe', async () => {
        createTicketTransaction.mockResolvedValue({ error: 'SERVICE_NOT_FOUND' })

        await expect(createTicket(validBody)).rejects.toMatchObject({
            statusCode: 404,
            code: 'SERVICE_NOT_FOUND'
        })
    })

    it('responde 409 si el servicio está inactivo', async () => {
        createTicketTransaction.mockResolvedValue({ error: 'SERVICE_INACTIVE' })

        await expect(createTicket(validBody)).rejects.toMatchObject({
            statusCode: 409,
            code: 'SERVICE_INACTIVE'
        })
    })
})
