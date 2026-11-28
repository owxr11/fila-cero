import { ROLES } from '../../config/permissions.js'
import { AppError } from '../../shared/errors/app-errors.js'
import { hashPassword } from '../../shared/security/password.js'
import { forgetSession } from '../../shared/security/session.js'
import * as repository from './user.repository.js'

export async function listUsers(filters) {
    return repository.listUsers(filters)
}

export async function createUser(data) {
    const existingUser = await repository.findByEmail(data.email)
    if (existingUser) {
        throw new AppError({
            statusCode: 409,
            code: 'EMAIL_EXISTS',
            message: 'El correo ya está registrado'
        })
    }

    return repository.createUser({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: data.role,
        active: true
    })
}

// Un administrador no puede quitarse su propio acceso
export async function updateUser(id, data, currentUserId) {
    const user = await repository.findById(id)
    if (!user) {
        throw new AppError({
            statusCode: 404,
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado'
        })
    }

    if (id === currentUserId) {
        if (data.role !== undefined && data.role !== ROLES.ADMIN) {
            throw new AppError({
                statusCode: 409,
                code: 'CANNOT_CHANGE_OWN_ROLE',
                message: 'No puedes cambiar tu propio rol'
            })
        }

        if (data.active === false) {
            throw new AppError({
                statusCode: 409,
                code: 'CANNOT_DISABLE_SELF',
                message: 'No puedes desactivar tu propia cuenta'
            })
        }
    }

    const updated = await repository.updateUser(id, data)
    forgetSession(id)
    return updated
}
