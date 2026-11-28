import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../src/modules/users/user.repository.js', () => ({
    findById: vi.fn()
}))

const userRepository = await import('../src/modules/users/user.repository.js')
// setup.js simula session.js en todas las pruebas; aquí se usa la versión real
const { verifySession, forgetSession } = await vi.importActual('../src/shared/security/session.js')
const session = await import('../src/shared/security/session.js')
const { authenticate } = await import('../src/shared/middleware/authenticate.middleware.js')
const { errorMiddleware } = await import('../src/shared/middleware/error.middleware.js')
const { AppError } = await import('../src/shared/errors/app-errors.js')
const { signAccessToken } = await import('../src/shared/security/tokens.js')

const operator = { id: 'op-1', name: 'Operador', role: 'OPERATOR', active: true }

describe('verifySession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        forgetSession(operator.id)
    })

    it('acepta a un usuario activo con el mismo rol del token', async () => {
        userRepository.findById.mockResolvedValue(operator)
        await expect(verifySession({ sub: operator.id, role: 'OPERATOR' })).resolves.toBeUndefined()
    })

    it('rechaza a un usuario desactivado aunque su token no haya vencido', async () => {
        userRepository.findById.mockResolvedValue({ ...operator, active: false })
        await expect(verifySession({ sub: operator.id, role: 'OPERATOR' }))
            .rejects.toMatchObject({ statusCode: 401, code: 'USER_DISABLED' })
    })

    it('rechaza un token de un usuario que ya no existe', async () => {
        userRepository.findById.mockResolvedValue(null)
        await expect(verifySession({ sub: operator.id, role: 'OPERATOR' }))
            .rejects.toMatchObject({ statusCode: 401, code: 'USER_DISABLED' })
    })

    it('pide renovar la sesión si el administrador le cambió el rol', async () => {
        userRepository.findById.mockResolvedValue({ ...operator, role: 'VISITOR' })
        await expect(verifySession({ sub: operator.id, role: 'OPERATOR' }))
            .rejects.toMatchObject({ statusCode: 401, code: 'SESSION_OUTDATED' })
    })

    it('guarda el usuario unos segundos y forgetSession obliga a leerlo de nuevo', async () => {
        userRepository.findById.mockResolvedValue(operator)

        await verifySession({ sub: operator.id, role: 'OPERATOR' })
        await verifySession({ sub: operator.id, role: 'OPERATOR' })
        expect(userRepository.findById).toHaveBeenCalledTimes(1)

        forgetSession(operator.id)
        userRepository.findById.mockResolvedValue({ ...operator, active: false })
        await expect(verifySession({ sub: operator.id, role: 'OPERATOR' })).rejects.toThrow()
        expect(userRepository.findById).toHaveBeenCalledTimes(2)
    })
})

describe('authenticate con la sesión revisada', () => {
    const testApp = express()
    testApp.get('/protegido', authenticate, (req, res) => res.json({ data: req.auth }))
    testApp.use(errorMiddleware)

    it('responde 401 si verifySession rechaza al usuario', async () => {
        session.verifySession.mockRejectedValueOnce(new AppError({
            statusCode: 401,
            code: 'USER_DISABLED',
            message: 'Usuario no disponible'
        }))

        const response = await request(testApp)
            .get('/protegido')
            .set('Authorization', `Bearer ${signAccessToken({ sub: 'op-1', role: 'OPERATOR' })}`)

        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('USER_DISABLED')
    })

    it('no consulta la sesión si el token es inválido', async () => {
        session.verifySession.mockClear()

        const response = await request(testApp)
            .get('/protegido')
            .set('Authorization', 'Bearer token-falso')

        expect(response.status).toBe(401)
        expect(session.verifySession).not.toHaveBeenCalled()
    })
})
