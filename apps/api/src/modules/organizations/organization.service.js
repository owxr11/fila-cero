import { AppError } from '../../shared/errors/app-errors.js'
import * as repository from './organization.repository.js'

function notFound() {
    return new AppError({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Establecimiento no encontrado'
    })
}

export async function getOrganization(id) {
    const organization = await repository.findById(id)

    if (!organization) {
        throw notFound()
    }

    return organization
}

export async function updateOrganization(id, changes) {
    const current = await repository.findById(id)

    if (!current) {
        throw notFound()
    }

    const defined = Object.fromEntries(
        Object.entries(changes).filter(([, value]) => value !== undefined)
    )

    return repository.update(id, defined)
}
