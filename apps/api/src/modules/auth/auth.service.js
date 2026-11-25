import { ROLES } from '../../config/permissions.js'
import { AppError } from '../../shared/errors/app-errors.js'
import { hashPassword, verifyPassword } from '../../shared/security/password.js'
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/security/tokens.js'
import * as userRepository from '../users/user.repository.js'
import * as authRepository from './auth.repository.js'

function invalidCredentials() {
    return new AppError({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos'
    })
}

function invalidRefreshToken() {
    return new AppError({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'La sesión expiró, vuelve a iniciar sesión'
    })
}

async function issueTokens(user) {
    const payload = {
        sub: user.id,
        role: user.role
    }
    const tokens = {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload)
    }

    await authRepository.saveRefreshToken({
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken)
    })

    return tokens
}

// El registro público SIEMPRE crea VISITOR. Los OPERATOR y ADMIN los crea un ADMIN en /users (o el script seed:users)
export async function register(data) {
    const existingUser = await userRepository.findByEmail(data.email)
    if (existingUser) {
        throw new AppError({
            statusCode: 409,
            code: 'EMAIL_EXISTS',
            message: 'El correo ya está registrado'
        })
    }

    const user = await userRepository.createUser({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: ROLES.VISITOR,
        active: true
    })

    return {
        user,
        ...await issueTokens(user)
    }
}

export async function login(data) {
    const userWithPassword = await userRepository.findByEmailWithPassword(data.email)
    if (!userWithPassword) {
        throw invalidCredentials()
    }

    const { passwordHash, ...user } = userWithPassword
    const validPassword = await verifyPassword(data.password, passwordHash)

    if (!validPassword || !user.active) {
        throw invalidCredentials()
    }

    return {
        user,
        ...await issueTokens(user)
    }
}

// Rotación: el refresh token usado se revoca y se entrega uno nuevo
export async function refresh(refreshToken) {
    let payload
    try {
        payload = verifyRefreshToken(refreshToken)
    } catch {
        throw invalidRefreshToken()
    }

    const tokenHash = hashToken(refreshToken)
    const storedToken = await authRepository.findRefreshToken(tokenHash)

    if (!storedToken || storedToken.revoked || storedToken.userId !== payload.sub) {
        throw invalidRefreshToken()
    }

    await authRepository.revokeRefreshToken(tokenHash)

    const user = await userRepository.findById(payload.sub)
    if (!user || !user.active) {
        throw new AppError({
            statusCode: 401,
            code: 'USER_DISABLED',
            message: 'Usuario no disponible'
        })
    }

    return issueTokens(user)
}

export async function logout(refreshToken) {
    await authRepository.revokeRefreshToken(hashToken(refreshToken))
}

export async function me(userId) {
    const user = await userRepository.findById(userId)
    if (!user) {
        throw new AppError({
            statusCode: 404,
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado'
        })
    }
    return user
}
