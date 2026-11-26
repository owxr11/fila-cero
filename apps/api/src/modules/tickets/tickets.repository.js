import { FieldValue } from 'firebase-admin/firestore'
import { db, COLLECTIONS } from '../../config/firebase.js'
import { ACTIVE_TICKET_STATUSES, buildDayKey, formatTicketCode } from './tickets.utils.js'

export async function createTicketTransaction({ serviceId, clientId }) {
    const dayKey = buildDayKey()

    const serviceRef = db.collection(COLLECTIONS.services).doc(serviceId)
    const statsRef = db.collection(COLLECTIONS.dailyStats).doc(`${serviceId}_${dayKey}`)
    const ticketRef = db.collection(COLLECTIONS.tickets).doc() // id automático
    const eventRef = db.collection(COLLECTIONS.serviceEvents).doc()

    const activeQuery = db
        .collection(COLLECTIONS.tickets)
        .where('serviceId', '==', serviceId)
        .where('dayKey', '==', dayKey)
        .where('clientId', '==', clientId)
        .where('status', 'in', ACTIVE_TICKET_STATUSES)
        .limit(1)

    return db.runTransaction(async (tx) => {
        const serviceSnap = await tx.get(serviceRef)
        if (!serviceSnap.exists) return { error: 'SERVICE_NOT_FOUND' }

        const service = serviceSnap.data()
        if (service.active === false) return { error: 'SERVICE_INACTIVE' }

        const [statsSnap, activeSnap] = await Promise.all([
            tx.get(statsRef),
            tx.get(activeQuery)
        ])

        if (!activeSnap.empty) {
            const existing = activeSnap.docs[0]
            return {
                error: 'ACTIVE_TICKET_EXISTS',
                existing: { id: existing.id, code: existing.data().code }
            }
        }

        const number = (statsSnap.data()?.lastNumber ?? 0) + 1
        const code = formatTicketCode(service.prefix, number)
        const orgId = service.orgId ?? 'demo'

        tx.set(
            statsRef,
            { serviceId, dayKey, lastNumber: number, issued: number },
            { merge: true }
        )

        tx.set(ticketRef, {
            orgId,
            serviceId,
            serviceName: service.name,
            clientId,
            number,
            code,
            dayKey,
            status: 'WAITING',
            counterId: null,
            createdAt: FieldValue.serverTimestamp(),
            calledAt: null,
            startedAt: null,
            finishedAt: null
        })

        tx.set(eventRef, {
            ticketId: ticketRef.id,
            serviceId,
            type: 'CREATED',
            actorId: null,
            at: FieldValue.serverTimestamp()
        })

        return {
            ticket: {
                id: ticketRef.id,
                orgId,
                serviceId,
                serviceName: service.name,
                number,
                code,
                dayKey,
                status: 'WAITING',
                counterId: null,
                createdAt: null,
                calledAt: null,
                startedAt: null,
                finishedAt: null
            }
        }
    }, { maxAttempts: 15 })
}
