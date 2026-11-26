import { FieldValue } from 'firebase-admin/firestore'
import { COLLECTIONS, db } from '../src/config/firebase.js'

const ORG_ID = 'demo'

const organization = {
    name: 'FilaCero Demo',
    address: 'Av. Siempre Viva 123, Ciudad de México',
    schedule: 'Lunes a viernes de 9:00 a 17:00',
    message: 'Toma tu turno desde aquí y espera a que te llamen en el tablero.',
    active: true
}

const services = [
    { name: 'Caja', prefix: 'A' },
    { name: 'Trámites', prefix: 'B' },
    { name: 'Información', prefix: 'C' }
]

const counters = [
    { name: 'Módulo 1', prefixes: ['A', 'B'] },
    { name: 'Módulo 2', prefixes: ['B', 'C'] }
]

async function seedOrganization() {
    const reference = db.collection(COLLECTIONS.organizations).doc(ORG_ID)
    const snapshot = await reference.get()

    if (!snapshot.exists) {
        await reference.set({
            ...organization,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        })

        console.log(`Organización ${ORG_ID} creada`)
        return
    }

    const missing = Object.fromEntries(
        Object.entries(organization).filter(([key]) => snapshot.get(key) === undefined)
    )

    if (Object.keys(missing).length === 0) {
        console.log(`Organización ${ORG_ID} ya existe`)
        return
    }

    await reference.update({ ...missing, updatedAt: FieldValue.serverTimestamp() })
    console.log(`Organización ${ORG_ID} completada con: ${Object.keys(missing).join(', ')}`)
}

async function seedServices() {
    const idsByPrefix = {}

    for (const service of services) {
        const existing = await db.collection(COLLECTIONS.services)
            .where('orgId', '==', ORG_ID)
            .where('prefix', '==', service.prefix)
            .limit(1)
            .get()

        if (!existing.empty) {
            idsByPrefix[service.prefix] = existing.docs[0].id
            console.log(`Servicio ${service.prefix} (${service.name}) ya existe: ${existing.docs[0].id}`)
            continue
        }

        const reference = await db.collection(COLLECTIONS.services).add({
            orgId: ORG_ID,
            name: service.name,
            prefix: service.prefix,
            active: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        })

        idsByPrefix[service.prefix] = reference.id
        console.log(`Servicio ${service.prefix} (${service.name}) creado: ${reference.id}`)
    }

    return idsByPrefix
}

async function seedCounters(idsByPrefix) {
    for (const counter of counters) {
        const existing = await db.collection(COLLECTIONS.counters)
            .where('orgId', '==', ORG_ID)
            .where('name', '==', counter.name)
            .limit(1)
            .get()

        if (!existing.empty) {
            console.log(`${counter.name} ya existe: ${existing.docs[0].id}`)
            continue
        }

        const reference = await db.collection(COLLECTIONS.counters).add({
            orgId: ORG_ID,
            name: counter.name,
            serviceIds: counter.prefixes.map((prefix) => idsByPrefix[prefix]),
            active: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        })

        console.log(`${counter.name} creado: ${reference.id}`)
    }
}

try {
    await seedOrganization()
    const idsByPrefix = await seedServices()
    await seedCounters(idsByPrefix)

    console.log('Catálogo listo ✅')
    process.exit(0)
} catch (error) {
    console.error('No se pudo crear el catálogo ❌')
    console.error(error.message)
    process.exit(1)
}
