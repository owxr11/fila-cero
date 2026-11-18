import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../../config/firebase.js'

const usersCollection = db.collection(COLLECTIONS.users)

function mapTimestamp(value) {
    return value?.toDate?.()?.toISOString() ?? null
}

// Nunca devuelve passwordHash
function mapUser(document) {
    if (!document.exists) {
        return null
    }

    const data = document.data()

    return {
        id: document.id,
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active,
        createdAt: mapTimestamp(data.createdAt),
        updatedAt: mapTimestamp(data.updatedAt)
    }
}

export async function createUser(data) {
    const user = usersCollection.doc()
    await user.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    })
    return mapUser(await user.get())
}

export async function updateUser(id, data) {
    const user = usersCollection.doc(id)
    await user.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
    })
    return mapUser(await user.get())
}

export async function findById(id) {
    const user = await usersCollection.doc(id).get()
    return mapUser(user)
}

export async function findByEmail(email) {
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get()
    return snapshot.empty ? null : mapUser(snapshot.docs[0])
}

// Solo para el login: incluye passwordHash para poder compararlo
export async function findByEmailWithPassword(email) {
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get()
    if (snapshot.empty) {
        return null
    }

    const document = snapshot.docs[0]
    return {
        ...mapUser(document),
        passwordHash: document.data().passwordHash
    }
}
