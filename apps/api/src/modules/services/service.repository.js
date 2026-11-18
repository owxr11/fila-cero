import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../../config/firebase.js'
import { AppError } from '../../shared/errors/app-errors.js'

const collection = () => db.collection(COLLECTIONS.services)

function toDate(value) {
    return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value ?? null
}

export function toService(snapshot) {
    const data = snapshot.data()

    return {
        id: snapshot.id,
        orgId: data.orgId,
        name: data.name,
        prefix: data.prefix,
        active: data.active,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
    }
}

function prefixExistsError(prefix) {
    return new AppError({
        statusCode: 409,
        code: 'SERVICE_PREFIX_EXISTS',
        message: `Ya existe un servicio con el prefijo ${prefix}`
    })
}

function notFoundError() {
    return new AppError({
        statusCode: 404,
        code: 'SERVICE_NOT_FOUND',
        message: 'Servicio no encontrado'
    })
}

function prefixQuery(orgId, prefix) {
    return collection()
        .where('orgId', '==', orgId)
        .where('prefix', '==', prefix)
        .limit(2)
}

export async function findAll({ orgId, active }) {
    let query = collection().where('orgId', '==', orgId)

    if (active !== undefined) {
        query = query.where('active', '==', active)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(toService)
}

export async function findById(id) {
    const snapshot = await collection().doc(id).get()
    return snapshot.exists ? toService(snapshot) : null
}

export async function findManyByIds(ids) {
    if (ids.length === 0) {
        return []
    }

    const snapshots = await db.getAll(...ids.map((id) => collection().doc(id)))
    return snapshots.filter((snapshot) => snapshot.exists).map(toService)
}

export async function create({ orgId, name, prefix, active }) {
    const reference = collection().doc()

    await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(prefixQuery(orgId, prefix))

        if (!existing.empty) {
            throw prefixExistsError(prefix)
        }

        transaction.set(reference, {
            orgId,
            name,
            prefix,
            active,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        })
    })

    return toService(await reference.get())
}

export async function update(id, changes) {
    const reference = collection().doc(id)

    await db.runTransaction(async (transaction) => {
        const current = await transaction.get(reference)

        if (!current.exists) {
            throw notFoundError()
        }

        if (changes.prefix !== undefined && changes.prefix !== current.get('prefix')) {
            const existing = await transaction.get(prefixQuery(current.get('orgId'), changes.prefix))

            if (existing.docs.some((doc) => doc.id !== id)) {
                throw prefixExistsError(changes.prefix)
            }
        }

        transaction.update(reference, {
            ...changes,
            updatedAt: FieldValue.serverTimestamp()
        })
    })

    return toService(await reference.get())
}
