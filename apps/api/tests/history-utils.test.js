import { describe, expect, it } from 'vitest'
import { attentionMinutes, averageAttentionMinutes, buildSummary, minutesBetween } from '../src/modules/history/history.utils.js'

const at = (minute) => new Date(Date.UTC(2026, 10, 25, 15, minute)).toISOString()

const done = (counterId, start, end) => ({ status: 'DONE', counterId, startedAt: at(start), finishedAt: at(end) })
const cancelled = (counterId) => ({ status: 'CANCELLED', counterId, calledAt: at(0) })

describe('tiempo de atención', () => {
    it('calcula los minutos entre inicio y fin', () => {
        expect(minutesBetween(at(0), at(7))).toBe(7)
        expect(attentionMinutes(done('m1', 10, 14))).toBe(4)
    })

    it('ignora tickets que no terminaron o con fechas incompletas', () => {
        expect(attentionMinutes(cancelled('m1'))).toBeNull()
        expect(attentionMinutes({ status: 'DONE', startedAt: at(5), finishedAt: null })).toBeNull()
        expect(minutesBetween(at(10), at(5))).toBeNull()
    })

    it('promedia solo los tickets terminados', () => {
        const tickets = [done('m1', 0, 4), done('m1', 10, 16), cancelled('m1')]

        expect(averageAttentionMinutes(tickets)).toBe(5)
    })

    it('devuelve null si no hay tickets terminados', () => {
        expect(averageAttentionMinutes([cancelled('m1')])).toBeNull()
        expect(averageAttentionMinutes([])).toBeNull()
    })

    it('acepta Timestamps de Firestore', () => {
        const timestamp = (minute) => ({ toMillis: () => Date.UTC(2026, 10, 25, 15, minute) })

        expect(minutesBetween(timestamp(0), timestamp(3))).toBe(3)
    })
})

describe('resumen por módulo', () => {
    it('cuenta atendidos y cancelados y promedia por módulo', () => {
        const tickets = [
            done('m1', 0, 4),
            done('m1', 10, 12),
            cancelled('m1'),
            done('m2', 0, 9),
            { status: 'CANCELLED', counterId: null }
        ]

        const summary = buildSummary(tickets, { m1: 'Módulo 1', m2: 'Módulo 2' })

        expect(summary.counters).toEqual([
            { counterId: 'm1', counterName: 'Módulo 1', attended: 2, cancelled: 1, averageAttentionMinutes: 3 },
            { counterId: 'm2', counterName: 'Módulo 2', attended: 1, cancelled: 0, averageAttentionMinutes: 9 },
            { counterId: null, counterName: 'Sin módulo asignado', attended: 0, cancelled: 1, averageAttentionMinutes: null }
        ])
        expect(summary.totals).toEqual({ attended: 3, cancelled: 2, averageAttentionMinutes: 5 })
    })

    it('incluye módulos sin tickets y oculta la fila sin módulo si solo hay tickets en espera', () => {
        const tickets = [done('m1', 0, 4), { status: 'WAITING', counterId: null }]

        const summary = buildSummary(tickets, { m1: 'Módulo 1', m2: 'Módulo 2' }, ['m1', 'm2'])

        expect(summary.counters).toEqual([
            { counterId: 'm1', counterName: 'Módulo 1', attended: 1, cancelled: 0, averageAttentionMinutes: 4 },
            { counterId: 'm2', counterName: 'Módulo 2', attended: 0, cancelled: 0, averageAttentionMinutes: null }
        ])
    })
})
