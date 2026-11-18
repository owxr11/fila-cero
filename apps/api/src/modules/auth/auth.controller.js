import * as authService from './auth.service.js'

export async function register(req, res) {
    const data = await authService.register(req.validated.body)
    return res.status(201).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function login(req, res) {
    const data = await authService.login(req.validated.body)
    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function refresh(req, res) {
    const data = await authService.refresh(req.validated.body.refreshToken)
    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function logout(req, res) {
    await authService.logout(req.validated.body.refreshToken)
    return res.status(204).send()
}

export async function me(req, res) {
    const data = await authService.me(req.auth.userId)
    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
