import { describe, expect, it } from 'vitest'
import express from 'express'
import request from 'supertest'
import { authenticate } from '../src/shared/middleware/authenticate.middleware.js'
import { authorize } from '../src/shared/middleware/authorize.middleware.js'
import { errorMiddleware } from '../src/shared/middleware/error.middleware.js'
import { signAccessToken } from '../src/shared/security/tokens.js'


const testApp = express()
testApp.post('/protegido',
    authenticate,
    authorize('services:create'),
    (req, res) => res.status(200).json({ success: true, data: req.auth })
)
testApp.use(errorMiddleware)

describe('authenticate + authorize', () => {
    it('responde 401 si no se envía token', async () => {
        const response = await request(testApp).post('/protegido')

        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('AUTH_REQUIRED')
    })

    it('responde 401 si el token es inválido', async () => {
        const response = await request(testApp)
            .post('/protegido')
            .set('Authorization', 'Bearer token-falso')

        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('INVALID_ACCESS_TOKEN')
    })

    it('responde 403 si el rol no tiene el permiso', async () => {
        const token = signAccessToken({ sub: 'u1', role: 'OPERATOR' })
        const response = await request(testApp)
            .post('/protegido')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(403)
        expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('permite el acceso a ADMIN', async () => {
        const token = signAccessToken({ sub: 'u2', role: 'ADMIN' })
        const response = await request(testApp)
            .post('/protegido')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.data.role).toBe('ADMIN')
    })
})
