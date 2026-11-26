import { COLLECTIONS, db } from '../../config/firebase.js'

const collection = () => db.collection(COLLECTIONS.tickets)

export async function findTicketById(id) {
    const snapshot = await collection().doc(id).get()

    if (!snapshot.exists) {
        return null
    }

    const data = snapshot.data()

    return {
        id: snapshot.id,
        orgId: data.orgId ?? 'demo',
        serviceId: data.serviceId,
        serviceName: data.serviceName ?? null,
        number: data.number,
        code: data.code,
        dayKey: data.dayKey,
        status: data.status,
        counterId: data.counterId ?? null,
        counterName: data.counterName ?? null
    }
}

// El ticket emitido puede no traer serviceName: se toma del servicio
export async function findServiceById(id) {
    const snapshot = await db.collection(COLLECTIONS.services).doc(id).get()

    if (!snapshot.exists) {
        return null
    }

    return {
        id: snapshot.id,
        name: snapshot.get('name')
    }
}

export async function findCounterById(id) {
    if (!id) return null
    const snapshot = await db.collection(COLLECTIONS.counters).doc(id).get()

    if (!snapshot.exists) {
        return null
    }

    return {
        id: snapshot.id,
        name: snapshot.get('name')
    }
}

export async function findActiveCountersByServiceId(serviceId) {
    const snapshot = await db.collection(COLLECTIONS.counters)
        .where('active', '==', true)
        .get()

    return snapshot.docs
        .filter((doc) => {
            const serviceIds = doc.get('serviceIds')
            return Array.isArray(serviceIds) && serviceIds.includes(serviceId)
        })
        .map((doc) => ({
            id: doc.id,
            name: doc.get('name'),
            serviceIds: doc.get('serviceIds') ?? []
        }))
}

// Usa el índice compuesto serviceId + dayKey + status + number (firebase/firestore.indexes.json)
export async function findWaiting(serviceId, dayKey) {
    const snapshot = await collection()
        .where('serviceId', '==', serviceId)
        .where('dayKey', '==', dayKey)
        .where('status', '==', 'WAITING')
        .orderBy('number', 'asc')
        .get()

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.get('code'),
        number: doc.get('number')
    }))
}

// Tickets que se están llamando o atendiendo (mismo índice compuesto), ordenados por número
export async function findInProgress(serviceId, dayKey) {
    const snapshot = await collection()
        .where('serviceId', '==', serviceId)
        .where('dayKey', '==', dayKey)
        .where('status', 'in', ['CALLED', 'IN_SERVICE'])
        .orderBy('number', 'asc')
        .get()

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.get('code'),
        number: doc.get('number'),
        counterId: doc.get('counterId') ?? null
    }))
}

// Últimos tickets terminados para el cálculo del estimador de espera
export async function findRecentFinished(serviceId, limit = 10) {
    try {
        const snapshot = await collection()
            .where('serviceId', '==', serviceId)
            .where('status', '==', 'DONE')
            .orderBy('finishedAt', 'desc')
            .limit(limit)
            .get()

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch {
        const snapshot = await collection()
            .where('serviceId', '==', serviceId)
            .where('status', '==', 'DONE')
            .limit(50)
            .get()

        const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }))

        docs.sort((a, b) => {
            const timeA = a.finishedAt?.toMillis?.() ?? (a.finishedAt ? new Date(a.finishedAt).getTime() : 0)
            const timeB = b.finishedAt?.toMillis?.() ?? (b.finishedAt ? new Date(b.finishedAt).getTime() : 0)
            return timeB - timeA
        })

        return docs.slice(0, limit)
    }
}
