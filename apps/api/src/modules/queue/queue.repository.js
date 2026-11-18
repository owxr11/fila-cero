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
        serviceId: data.serviceId,
        serviceName: data.serviceName ?? null,
        number: data.number,
        code: data.code,
        dayKey: data.dayKey,
        status: data.status
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
