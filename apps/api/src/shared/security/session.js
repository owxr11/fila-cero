import { AppError } from '../errors/app-errors.js'
import * as userRepository from '../../modules/users/user.repository.js'

// Se guarda unos segundos para no leer Firestore en cada petición
const CACHE_MS = 30 * 1000
const cache = new Map()

async function loadUser(userId) {
    const cached = cache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
        return cached.user
    }

    const user = await userRepository.findById(userId)
    cache.set(userId, {
        user,
        expiresAt: Date.now() + CACHE_MS
    })
    return user
}

// Se llama cuando un administrador edita al usuario, para que el cambio aplique de inmediato
export function forgetSession(userId) {
    cache.delete(userId)
}

// El token dura 15 minutos: aquí se revisa que el usuario siga activo y con el mismo rol
export async function verifySession(payload) {
    const user = await loadUser(payload.sub)

    if (!user || !user.active) {
        throw new AppError({
            statusCode: 401,
            code: 'USER_DISABLED',
            message: 'Usuario no disponible'
        })
    }

    // El frontend renueva la sesión al recibir 401 y obtiene un token con el rol nuevo
    if (user.role !== payload.role) {
        throw new AppError({
            statusCode: 401,
            code: 'SESSION_OUTDATED',
            message: 'Tus permisos cambiaron, vuelve a iniciar sesión'
        })
    }
}
