import { AppError } from '../../shared/errors/app-errors.js'
import * as repository from './service.repository.js'

export const DEFAULT_ORG_ID = 'demo'

function pickDefined(object) {
    return Object.fromEntries(
        Object.entries(object).filter(([, value]) => value !== undefined)
    )
}

export async function listServices({ active } = {}) {
    const services = await repository.findAll({
        orgId: DEFAULT_ORG_ID,
        active: active === undefined ? undefined : active === 'true'
    })

    return services.sort((a, b) => a.prefix.localeCompare(b.prefix))
}

export async function getService(id) {
    const service = await repository.findById(id)

    if (!service) {
        throw new AppError({
            statusCode: 404,
            code: 'SERVICE_NOT_FOUND',
            message: 'Servicio no encontrado'
        })
    }

    return service
}

export async function createService({ name, prefix, active }) {
    return repository.create({
        orgId: DEFAULT_ORG_ID,
        name,
        prefix,
        active
    })
}

export async function updateService(id, changes) {
    return repository.update(id, pickDefined(changes))
}
