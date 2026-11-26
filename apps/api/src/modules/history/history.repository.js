import { COLLECTIONS, db } from '../../config/firebase.js'

function toIso(value) {
    return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value ?? null
}

function toHistoryTicket(snapshot) {
    const data = snapshot.data()

    return {
        id: snapshot.id,
        serviceId: data.serviceId,
        serviceName: data.serviceName ?? null,
        number: data.number,
        code: data.code,
        dayKey: data.dayKey,
        status: data.status,
        counterId: data.counterId ?? null,
        createdAt: toIso(data.createdAt),
        calledAt: toIso(data.calledAt),
        startedAt: toIso(data.startedAt),
        finishedAt: toIso(data.finishedAt),
        cancelledAt: toIso(data.cancelledAt)
    }
}

export async function findTickets({ date, serviceId, counterId, status }) {
    let query = db.collection(COLLECTIONS.tickets).where('dayKey', '==', date)

    if (serviceId) {
        query = query.where('serviceId', '==', serviceId)
    }

    if (counterId) {
        query = query.where('counterId', '==', counterId)
    }

    if (status) {
        query = query.where('status', '==', status)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(toHistoryTicket)
}
