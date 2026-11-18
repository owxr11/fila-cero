import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { signAccessToken } from '../src/shared/security/tokens.js'

describe('rutas protegidas del catálogo', () => {
    it('POST /services responde 401 sin token', async () => {
        const response = await request(app)
            .post('/api/v1/services')
            .send({ name: 'Caja', prefix: 'A' })

        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('AUTH_REQUIRED')
    })

    it('POST /services responde 403 a un OPERATOR', async () => {
        const token = signAccessToken({ sub: 'op', role: 'OPERATOR' })
        const response = await request(app)
            .post('/api/v1/services')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Caja', prefix: 'A' })

        expect(response.status).toBe(403)
    })

    it('POST /services responde 400 a un ADMIN con prefix inválido', async () => {
        const token = signAccessToken({ sub: 'admin', role: 'ADMIN' })
        const response = await request(app)
            .post('/api/v1/services')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Caja', prefix: 'ab' })

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('POST /counters responde 403 a un VISITOR', async () => {
        const token = signAccessToken({ sub: 'v', role: 'VISITOR' })
        const response = await request(app)
            .post('/api/v1/counters')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Módulo 1', serviceIds: ['x'] })

        expect(response.status).toBe(403)
    })
})
