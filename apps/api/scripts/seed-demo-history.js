import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../src/config/firebase.js'
import { buildDayKey, formatTicketCode } from '../src/modules/tickets/tickets.utils.js'

const ORG_ID = 'demo'

// Duraciones de prueba en minutos para generar historial variado y realista
const SAMPLE_DURATIONS_BY_SERVICE = {
    A: [4.5, 5.0, 6.0, 4.0, 5.5, 7.0, 6.5, 5.0, 4.5, 6.0], // Promedio ~5.4 min
    B: [7.0, 8.5, 6.5, 9.0, 7.5, 8.0, 6.0, 7.5, 8.5, 7.5], // Promedio ~7.6 min
    C: [3.5, 4.0, 3.0, 5.0, 4.5, 3.5, 4.0, 4.5, 3.0, 4.0]  // Promedio ~3.9 min
}

async function findOrCreateServices() {
    const snapshot = await db.collection(COLLECTIONS.services).where('orgId', '==', ORG_ID).get()

    if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.get('name'),
            prefix: doc.get('prefix')
        }))
    }

    // Si aún no se corrió seed-catalog, creamos servicios demo básicos
    console.log('No se encontraron servicios previos. Creando servicios demo...')
    const defaultServices = [
        { name: 'Caja', prefix: 'A' },
        { name: 'Trámites', prefix: 'B' },
        { name: 'Información', prefix: 'C' }
    ]

    const created = []
    for (const service of defaultServices) {
        const ref = await db.collection(COLLECTIONS.services).add({
            orgId: ORG_ID,
            name: service.name,
            prefix: service.prefix,
            active: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        })
        created.push({ id: ref.id, ...service })
    }

    return created
}

async function findOrCreateCounters(services) {
    const snapshot = await db.collection(COLLECTIONS.counters).where('orgId', '==', ORG_ID).get()

    if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.get('name'),
            serviceIds: doc.get('serviceIds') ?? []
        }))
    }

    console.log('No se encontraron módulos previos. Creando módulos demo...')
    const counterDefs = [
        { name: 'Módulo 1', prefixes: ['A', 'B'] },
        { name: 'Módulo 2', prefixes: ['B', 'C'] }
    ]

    const prefixToId = Object.fromEntries(services.map((s) => [s.prefix, s.id]))
    const created = []

    for (const counter of counterDefs) {
        const ref = await db.collection(COLLECTIONS.counters).add({
            orgId: ORG_ID,
            name: counter.name,
            serviceIds: counter.prefixes.map((p) => prefixToId[p]).filter(Boolean),
            active: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        })
        created.push({ id: ref.id, name: counter.name, serviceIds: counter.prefixes.map((p) => prefixToId[p]) })
    }

    return created
}

async function seedHistory() {
    console.log('--- Iniciando seed de historial ficticio para el estimador ---')
    const services = await findOrCreateServices()
    const counters = await findOrCreateCounters(services)

    const dayKey = buildDayKey()
    const now = Date.now()

    let totalCreated = 0

    for (const service of services) {
        const durations = SAMPLE_DURATIONS_BY_SERVICE[service.prefix] ?? [5, 6, 4, 5, 7, 6, 5, 4, 6, 5]
        const supportingCounters = counters.filter((c) => c.serviceIds.includes(service.id))
        const defaultCounter = supportingCounters[0] ?? counters[0] ?? { id: 'modulo-1', name: 'Módulo 1' }

        console.log(`Creando ${durations.length} tickets terminados para "${service.name}" (${service.prefix})...`)

        let timelineOffsetMinutes = 120 // Comenzar 2 horas atrás en el tiempo

        for (let i = 0; i < durations.length; i++) {
            const durationMinutes = durations[i]
            const counter = supportingCounters[i % supportingCounters.length] ?? defaultCounter

            const finishedTimeMs = now - timelineOffsetMinutes * 60 * 1000
            const startedTimeMs = finishedTimeMs - durationMinutes * 60 * 1000
            const calledTimeMs = startedTimeMs - 1 * 60 * 1000
            const createdTimeMs = calledTimeMs - 8 * 60 * 1000

            timelineOffsetMinutes -= durationMinutes + 2 // Avanzar tiempo hacia el presente

            const ticketNumber = i + 100 // Número ficticio para no colisionar con tickets del día
            const ticketCode = formatTicketCode(service.prefix, ticketNumber)

            const ticketRef = await db.collection(COLLECTIONS.tickets).add({
                orgId: ORG_ID,
                serviceId: service.id,
                serviceName: service.name,
                number: ticketNumber,
                code: ticketCode,
                dayKey,
                status: 'DONE',
                counterId: counter.id,
                counterName: counter.name,
                durationMinutes,
                createdAt: Timestamp.fromMillis(createdTimeMs),
                calledAt: Timestamp.fromMillis(calledTimeMs),
                startedAt: Timestamp.fromMillis(startedTimeMs),
                finishedAt: Timestamp.fromMillis(finishedTimeMs)
            })

            // Registrar evento de servicio FINISHED
            await db.collection(COLLECTIONS.serviceEvents).add({
                ticketId: ticketRef.id,
                serviceId: service.id,
                type: 'FINISHED',
                counterId: counter.id,
                durationMinutes,
                createdAt: Timestamp.fromMillis(finishedTimeMs)
            })

            totalCreated++
        }

        const avgDuration = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
        console.log(`✓ ${durations.length} tickets creados para ${service.name}. Promedio duración: ${avgDuration} min.`)
    }

    console.log(`\nHistorial ficticio generado con éxito: ${totalCreated} tickets terminados `)
}

try {
    await seedHistory()
    process.exit(0)
} catch (error) {
    console.error('Error al generar historial de demostración ')
    console.error(error.message)
    process.exit(1)
}
