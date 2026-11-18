import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../../config/firebase.js'

const collection = () => db.collection(COLLECTIONS.counters)

function toDate(value) {
    return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value ?? null
}

function toCounter(snapshot) {
    const data = snapshot.data()

    return {
        id: snapshot.id,
        orgId: data.orgId,
        name: data.name,
        serviceIds: data.serviceIds ?? [],
        active: data.active,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
    }
}

export async function findAll({ orgId, active }) {
    let query = collection().where('orgId', '==', orgId)

    if (active !== undefined) {
        query = query.where('active', '==', active)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(toCounter)
}

export async function findById(id) {
    const snapshot = await collection().doc(id).get()
    return snapshot.exists ? toCounter(snapshot) : null
}

export async function create({ orgId, name, serviceIds, active }) {
    const reference = collection().doc()

    await reference.set({
        orgId,
        name,
        serviceIds,
        active,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    })

    return toCounter(await reference.get())
}

export async function update(id, changes) {
    const reference = collection().doc(id)

    await reference.update({
        ...changes,
        updatedAt: FieldValue.serverTimestamp()
    })

    return toCounter(await reference.get())
}
