import { AppError } from '../../shared/errors/app-errors.js'
import { findManyByIds } from '../services/service.repository.js'
import { DEFAULT_ORG_ID } from '../services/service.service.js'
import * as repository from './counter.repository.js'

function pickDefined(object) {
    return Object.fromEntries(
        Object.entries(object).filter(([, value]) => value !== undefined)
    )
}

async function ensureServicesExist(serviceIds) {
    const services = await findManyByIds(serviceIds)
    const foundIds = new Set(
        services
            .filter((service) => service.orgId === DEFAULT_ORG_ID)
            .map((service) => service.id)
    )
    const missing = serviceIds.filter((id) => !foundIds.has(id))

    if (missing.length > 0) {
        throw new AppError({
            statusCode: 400,
            code: 'SERVICE_NOT_FOUND',
            message: 'Uno o más servicios del módulo no existen',
            details: { missing }
        })
    }
}

export async function listCounters({ active } = {}) {
    const counters = await repository.findAll({
        orgId: DEFAULT_ORG_ID,
        active: active === undefined ? undefined : active === 'true'
    })

    return counters.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
}

export async function createCounter({ name, serviceIds, active }) {
    await ensureServicesExist(serviceIds)

    return repository.create({
        orgId: DEFAULT_ORG_ID,
        name,
        serviceIds,
        active
    })
}

export async function updateCounter(id, changes) {
    const current = await repository.findById(id)

    if (!current) {
        throw new AppError({
            statusCode: 404,
            code: 'COUNTER_NOT_FOUND',
            message: 'Módulo no encontrado'
        })
    }

    if (changes.serviceIds !== undefined) {
        await ensureServicesExist(changes.serviceIds)
    }

    return repository.update(id, pickDefined(changes))
}
