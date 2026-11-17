import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

describe('GET /api/v1/health', () => {
    it('responde 200 con status ok', async () => {
        const response = await request(app).get('/api/v1/health')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.status).toBe('ok')
    })
})
