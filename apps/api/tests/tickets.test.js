import { describe, it, expect } from 'vitest'
import { buildDayKey, formatTicketCode } from '../src/modules/tickets/tickets.utils.js'
import { createTicketSchema } from '../src/modules/tickets/tickets.schema.js'

describe('formatTicketCode', () => {
    it('rellena con ceros a 3 dígitos', () => {
        expect(formatTicketCode('A', 1)).toBe('A-001')
        expect(formatTicketCode('B', 42)).toBe('B-042')
        expect(formatTicketCode('C', 123)).toBe('C-123')
    })
})

describe('buildDayKey', () => {
    it('usa la zona horaria de México, no UTC', () => {
        // 03:00 UTC del 18 de nov = 21:00 del 17 de nov en México
        expect(buildDayKey(new Date('2026-11-18T03:00:00Z'))).toBe('2026-11-17')
        // 06:00 UTC del 18 de nov = 00:00 del 18 de nov en México
        expect(buildDayKey(new Date('2026-11-18T06:00:00Z'))).toBe('2026-11-18')
    })
})

describe('createTicketSchema', () => {
    it('rechaza un body sin serviceId', () => {
        expect(createTicketSchema.safeParse({ body: {} }).success).toBe(false)
    })

    it('rechaza un serviceId vacío', () => {
        expect(createTicketSchema.safeParse({ body: { serviceId: '   ' } }).success).toBe(false)
    })

    it('acepta un serviceId válido', () => {
        expect(createTicketSchema.safeParse({ body: { serviceId: 'abc123' } }).success).toBe(true)
    })
})
