import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

describe('Rutas inexistentes', () => {
    it('responde 404 con el formato de error de la API', async () => {
        const response = await request(app).get('/api/v1/no-existe')

        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
    })
})
