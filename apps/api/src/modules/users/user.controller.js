import * as service from './user.service.js'

export async function listUsers(req, res) {
    const users = await service.listUsers(req.validated.query)

    return res.status(200).json({
        success: true,
        data: users,
        meta: {
            count: users.length,
            requestId: req.id
        }
    })
}

export async function createUser(req, res) {
    const data = await service.createUser(req.validated.body)

    return res.status(201).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function updateUser(req, res) {
    const data = await service.updateUser(
        req.validated.params.id,
        req.validated.body,
        req.auth.userId
    )

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
