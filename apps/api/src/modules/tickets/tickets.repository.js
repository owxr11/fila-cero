import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../config/firebase.js';
import { buildDayKey, formatTicketCode } from './tickets.utils.js';

export async function createTicketTransaction(serviceId) {
    const dayKey = buildDayKey();
    const serviceRef = db.collection('services').doc(serviceId);
    const statsRef = db.collection('dailyStats').doc(`${serviceId}_${dayKey}`);
    const ticketRef = db.collection('tickets').doc();   // id automático
    const eventRef = db.collection('serviceEvents').doc();

    return db.runTransaction(async (tx) => {
        // --- LECTURAS ---
        const serviceSnap = await tx.get(serviceRef);
        if (!serviceSnap.exists) return { error: 'NOT_FOUND' };
        const service = serviceSnap.data();
        if (service.active === false) return { error: 'INACTIVE' };

        const statsSnap = await tx.get(statsRef);

        // --- LÓGICA ---
        const number = (statsSnap.data()?.lastNumber ?? 0) + 1;
        const code = formatTicketCode(service.prefix, number);

        // --- ESCRITURAS ---
        tx.set(statsRef, { serviceId, dayKey, lastNumber: number }, { merge: true });
        tx.set(ticketRef, {
            serviceId, dayKey, number, code,
            status: 'WAITING',
            createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(eventRef, {
            ticketId: ticketRef.id, serviceId, type: 'CREATED',
            from: null, to: 'WAITING',
            createdAt: FieldValue.serverTimestamp(),
        });

        return { ticket: { id: ticketRef.id, serviceId, code, number, status: 'WAITING', dayKey } };
    });
}
