import { describe, expect, it } from 'vitest'
import { createServiceSchema, updateServiceSchema } from '../src/modules/services/service.schema.js'
import { createCounterSchema } from '../src/modules/counters/counter.schema.js'

describe('schema de servicios', () => {
    it('rechaza un prefix inválido', () => {
        for (const prefix of ['a', 'AB', '1', '', 'Ñ']) {
            const result = createServiceSchema.safeParse({ body: { name: 'Caja', prefix } })

            expect(result.success).toBe(false)
            expect(result.error.issues[0].path).toEqual(['body', 'prefix'])
        }
    })

    it('rechaza un nombre vacío o fuera de rango', () => {
        for (const name of ['', '   ', 'A', 'x'.repeat(61)]) {
            const result = createServiceSchema.safeParse({ body: { name, prefix: 'A' } })

            expect(result.success).toBe(false)
            expect(result.error.issues[0].path).toEqual(['body', 'name'])
        }
    })

    it('acepta un servicio válido y pone active en true por defecto', () => {
        const result = createServiceSchema.parse({ body: { name: '  Caja  ', prefix: 'A' } })

        expect(result.body).toEqual({ name: 'Caja', prefix: 'A', active: true })
    })

    it('rechaza un PATCH sin campos', () => {
        const result = updateServiceSchema.safeParse({ params: { id: 'abc' }, body: {} })

        expect(result.success).toBe(false)
    })
})

describe('schema de módulos', () => {
    it('rechaza un módulo sin servicios', () => {
        const result = createCounterSchema.safeParse({ body: { name: 'Módulo 1', serviceIds: [] } })

        expect(result.success).toBe(false)
        expect(result.error.issues[0].path).toEqual(['body', 'serviceIds'])
    })

    it('elimina serviceIds repetidos', () => {
        const result = createCounterSchema.parse({ body: { name: 'Módulo 1', serviceIds: ['a', 'b', 'a'] } })

        expect(result.body.serviceIds).toEqual(['a', 'b'])
    })
})
