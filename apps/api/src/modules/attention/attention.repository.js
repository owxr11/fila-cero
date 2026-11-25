import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../../config/firebase.js'
import { ACTIVE_STATUSES } from './attention.utils.js'

const tickets = () => db.collection(COLLECTIONS.tickets)

function toDate(value) {
    return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value ?? null
}

function toTicket(snapshot) {
    const data = snapshot.data()

    return {
        id: snapshot.id,
        serviceId: data.serviceId,
        number: data.number,
        code: data.code,
        dayKey: data.dayKey,
        status: data.status,
        counterId: data.counterId ?? null,
        createdAt: toDate(data.createdAt),
        calledAt: toDate(data.calledAt),
        startedAt: toDate(data.startedAt),
        finishedAt: toDate(data.finishedAt),
        cancelledAt: toDate(data.cancelledAt)
    }
}

function toCounter(snapshot) {
    const data = snapshot.data()

    return {
        id: snapshot.id,
        name: data.name,
        serviceIds: data.serviceIds ?? [],
        active: data.active
    }
}

// Todas las lecturas y escrituras reciben `tx` al final.
// En las lecturas es opcional: sin transacción se lee directo (GET /attention/counter/:counterId).
function read(target, tx) {
    return tx ? tx.get(target) : target.get()
}

// Ejecuta la operación completa dentro de una transacción de Firestore
export function runInTransaction(operation) {
    return db.runTransaction(operation)
}

export async function findTicketById(id, tx) {
    const snapshot = await read(tickets().doc(id), tx)
    return snapshot.exists ? toTicket(snapshot) : null
}

export async function findCounterById(id, tx) {
    const snapshot = await read(db.collection(COLLECTIONS.counters).doc(id), tx)
    return snapshot.exists ? toCounter(snapshot) : null
}

// Ticket que el módulo tiene llamado o en atención hoy (null si está libre)
export async function findActiveByCounter(counterId, dayKey, tx) {
    const query = tickets()
        .where('counterId', '==', counterId)
        .where('dayKey', '==', dayKey)
        .where('status', 'in', [...ACTIVE_STATUSES])
        .limit(1)

    const snapshot = await read(query, tx)
    return snapshot.empty ? null : toTicket(snapshot.docs[0])
}

// Primer ticket en espera de cada servicio.
// Usa el índice compuesto serviceId + dayKey + status + number (firebase/firestore.indexes.json)
export async function findFirstWaitingByService(serviceIds, dayKey, tx) {
    const snapshots = await Promise.all(serviceIds.map((serviceId) => {
        const query = tickets()
            .where('serviceId', '==', serviceId)
            .where('dayKey', '==', dayKey)
            .where('status', '==', 'WAITING')
            .orderBy('number', 'asc')
            .limit(1)

        return read(query, tx)
    }))

    return snapshots
        .filter((snapshot) => !snapshot.empty)
        .map((snapshot) => toTicket(snapshot.docs[0]))
}

export function updateTicket(id, changes, tx) {
    tx.update(tickets().doc(id), changes)
}

export function recordEvent(event, tx) {
    tx.set(db.collection(COLLECTIONS.serviceEvents).doc(), {
        ...event,
        createdAt: FieldValue.serverTimestamp()
    })
}