import { describe, expect, it } from 'vitest'
import {
    calculateEstimatedWaitTime,
    estimateWaitTime,
    extractDurationInMinutes
} from '../src/modules/queue/queue.estimator.js'

describe('queue.estimator - estimateWaitTime', () => {
    describe('1. Sin historial', () => {
        it('usa el valor por defecto de 5 minutos por persona e indica isDefault = true con 0 tickets usados', () => {
            const result = estimateWaitTime({
                ahead: 2,
                activeCounters: 1,
                recentTickets: []
            })

            // 5 minutos * 2 personas / 1 módulo = 10 minutos
            expect(result.estimatedMinutes).toBe(10)
            expect(result.isDefault).toBe(true)
            expect(result.ticketsSampled).toBe(0)
            expect(result.averageDurationMinutes).toBe(5)
            expect(result.isDefaultEstimate).toBe(true)
            expect(result.ticketsUsed).toBe(0)
        })

        it('acepta argumentos posicionales sin historial', () => {
            const result = estimateWaitTime(3, 1, [])

            // 5 minutos * 3 personas / 1 módulo = 15 minutos
            expect(result.estimatedMinutes).toBe(15)
            expect(result.isDefault).toBe(true)
            expect(result.ticketsSampled).toBe(0)
        })
    })

    describe('2. Con historial', () => {
        it('calcula el promedio de los tickets terminados e indica isDefault = false', () => {
            // Historial con duraciones: 6, 4, 8, 6 minutos -> promedio = 6.0 minutos
            const recentTickets = [
                { durationMinutes: 6 },
                { durationMinutes: 4 },
                { durationMinutes: 8 },
                { durationMinutes: 6 }
            ]

            const result = estimateWaitTime({
                ahead: 3,
                activeCounters: 1,
                recentTickets
            })

            // 6 min promedio * 3 personas / 1 módulo = 18 minutos
            expect(result.estimatedMinutes).toBe(18)
            expect(result.isDefault).toBe(false)
            expect(result.ticketsSampled).toBe(4)
            expect(result.averageDurationMinutes).toBe(6)
            expect(result.isDefaultEstimate).toBe(false)
            expect(result.ticketsUsed).toBe(4)
        })

        it('soporta duraciones pasadas directamente como números o con timestamps', () => {
            const now = Date.now()
            const recentTickets = [
                {
                    startedAt: new Date(now - 10 * 60 * 1000),
                    finishedAt: new Date(now - 5 * 60 * 1000) // 5 minutos
                },
                {
                    startedAt: new Date(now - 20 * 60 * 1000),
                    finishedAt: new Date(now - 13 * 60 * 1000) // 7 minutos
                }
            ]

            const result = estimateWaitTime({
                ahead: 2,
                activeCounters: 1,
                recentTickets
            })

            // Promedio: (5 + 7) / 2 = 6 minutos. 6 * 2 / 1 = 12 minutos
            expect(result.estimatedMinutes).toBe(12)
            expect(result.isDefault).toBe(false)
            expect(result.ticketsSampled).toBe(2)
        })

        it('usa como máximo los últimos 10 tickets terminados aunque haya más', () => {
            // 15 tickets de 4 minutos cada uno
            const recentTickets = Array.from({ length: 15 }, () => ({ durationMinutes: 4 }))

            const result = estimateWaitTime({
                ahead: 2,
                activeCounters: 1,
                recentTickets
            })

            expect(result.ticketsSampled).toBe(10)
            expect(result.estimatedMinutes).toBe(8) // 4 * 2 / 1 = 8
        })

        it('funciona correctamente con tickets viejos sin orgId ni serviceName', () => {
            const legacyTickets = [
                { id: 'old-1', number: 1, code: 'A-001', durationMinutes: 5, status: 'DONE' },
                { id: 'old-2', number: 2, code: 'A-002', durationMinutes: 7, status: 'DONE' }
            ]

            const result = estimateWaitTime({
                ahead: 2,
                activeCounters: 1,
                recentTickets: legacyTickets
            })

            // Promedio (5 + 7) / 2 = 6 min. 6 * 2 / 1 = 12 min
            expect(result.estimatedMinutes).toBe(12)
            expect(result.isDefault).toBe(false)
            expect(result.ticketsSampled).toBe(2)
        })
    })

    describe('3. Sin personas delante', () => {
        it('devuelve 0 minutos cuando ahead = 0 (tanto con historial como sin historial)', () => {
            // Sin historial
            const sinHistorial = estimateWaitTime({
                ahead: 0,
                activeCounters: 1,
                recentTickets: []
            })
            expect(sinHistorial.estimatedMinutes).toBe(0)
            expect(sinHistorial.isDefault).toBe(true)

            // Con historial
            const conHistorial = estimateWaitTime({
                ahead: 0,
                activeCounters: 1,
                recentTickets: [{ durationMinutes: 10 }]
            })
            expect(conHistorial.estimatedMinutes).toBe(0)
            expect(conHistorial.isDefault).toBe(false)
            expect(conHistorial.ticketsSampled).toBe(1)
        })
    })

    describe('4. Con dos módulos activos', () => {
        it('divide el tiempo entre los 2 módulos activos reduciendo la espera a la mitad', () => {
            // 4 personas delante, promedio 6 minutos, 2 módulos
            // (6 min * 4 personas) / 2 módulos = 12 minutos
            const result = estimateWaitTime({
                ahead: 4,
                activeCounters: 2,
                recentTickets: [{ durationMinutes: 6 }]
            })

            expect(result.estimatedMinutes).toBe(12)
            expect(result.isDefault).toBe(false)
            expect(result.ticketsSampled).toBe(1)
        })

        it('divide entre 2 módulos también cuando no hay historial (valor por defecto 5 min)', () => {
            // (5 min * 4 personas) / 2 módulos = 10 minutos
            const result = estimateWaitTime({
                ahead: 4,
                activeCounters: 2,
                recentTickets: []
            })

            expect(result.estimatedMinutes).toBe(10)
            expect(result.isDefault).toBe(true)
        })
    })

    describe('Casos límite y alias', () => {
        it('calculateEstimatedWaitTime es un alias de estimateWaitTime', () => {
            expect(calculateEstimatedWaitTime).toBe(estimateWaitTime)
        })

        it('evita división por cero si activeCounters es 0 o negativo', () => {
            const result = estimateWaitTime({
                ahead: 2,
                activeCounters: 0,
                recentTickets: []
            })

            // Si activeCounters es 0, asume al menos 1
            expect(result.estimatedMinutes).toBe(10)
        })
    })
})

describe('queue.estimator - extractDurationInMinutes', () => {
    it('extrae duración de número directo en minutos', () => {
        expect(extractDurationInMinutes(8)).toBe(8)
    })

    it('extrae duración de durationMinutes', () => {
        expect(extractDurationInMinutes({ durationMinutes: 7.5 })).toBe(7.5)
    })

    it('extrae duración de diferencia entre finishedAt y startedAt', () => {
        const startedAt = '2026-11-23T10:00:00.000Z'
        const finishedAt = '2026-11-23T10:06:30.000Z'
        expect(extractDurationInMinutes({ startedAt, finishedAt })).toBe(6.5)
    })
})
