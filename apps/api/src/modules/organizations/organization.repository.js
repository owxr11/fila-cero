import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../../config/firebase.js'

const collection = () => db.collection(COLLECTIONS.organizations)

function toDate(value) {
    return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value ?? null
}

function toOrganization(snapshot) {
    const data = snapshot.data()

    return {
        id: snapshot.id,
        name: data.name ?? '',
        address: data.address ?? '',
        schedule: data.schedule ?? '',
        message: data.message ?? '',
        active: data.active ?? true,
        updatedAt: toDate(data.updatedAt)
    }
}

export async function findById(id) {
    const snapshot = await collection().doc(id).get()
    return snapshot.exists ? toOrganization(snapshot) : null
}

export async function update(id, changes) {
    const reference = collection().doc(id)

    await reference.update({
        ...changes,
        updatedAt: FieldValue.serverTimestamp()
    })

    return toOrganization(await reference.get())
}
