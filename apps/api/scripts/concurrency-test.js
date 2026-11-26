
const API_URL = process.env.API_URL ?? 'http://localhost:4050/api/v1'
const SERVICE_ID = process.env.SERVICE_ID ?? process.argv[2]
const TOTAL = Number(process.env.TOTAL ?? 30)

if (!SERVICE_ID) {
    console.error('Falta el serviceId. Uso: SERVICE_ID=<id> npm run test:concurrency')
    process.exit(1)
}

const runId = Date.now().toString(36)

async function issueTicket(clientId) {
    const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: SERVICE_ID, clientId })
    })
    const body = await response.json().catch(() => null)
    return { status: response.status, body }
}

let failed = false


console.log(`\n[1] ${TOTAL} solicitudes simultáneas con clientId distinto...`)

const results = await Promise.all(
    Array.from({ length: TOTAL }, (_, i) => issueTicket(`concurrencia-${runId}-${i}`))
)

const created = results.filter((r) => r.status === 201)
const numbers = created.map((r) => r.body.data.number)
const codes = created.map((r) => r.body.data.code)
const uniqueNumbers = new Set(numbers)
const uniqueCodes = new Set(codes)

console.log(`    Creados (201): ${created.length}/${TOTAL}`)
console.log(`    Números únicos: ${uniqueNumbers.size}`)
console.log(`    Rango: ${Math.min(...numbers)} a ${Math.max(...numbers)}`)

const otherStatuses = results.filter((r) => r.status !== 201)
if (otherStatuses.length > 0) {
    console.log('    Respuestas distintas de 201:', otherStatuses.map((r) => r.status))
}

if (created.length !== TOTAL || uniqueNumbers.size !== TOTAL || uniqueCodes.size !== TOTAL) {
    console.log('FALLÓ: hay números repetidos o solicitudes sin crear')
    failed = true
} else {
    console.log('OK: ningún número se repite')
}


console.log('\n[2] 5 solicitudes simultáneas con el MISMO clientId...')

const sameClient = `duplicado-${runId}`
const dupResults = await Promise.all(Array.from({ length: 5 }, () => issueTicket(sameClient)))

const dupCreated = dupResults.filter((r) => r.status === 201).length
const dupRejected = dupResults.filter(
    (r) => r.status === 409 && r.body?.error?.code === 'ACTIVE_TICKET_EXISTS'
).length

console.log(`    Creados: ${dupCreated}, rechazados por duplicado: ${dupRejected}`)

if (dupCreated !== 1 || dupRejected !== 4) {
    console.log('FALLÓ: debía crearse exactamente 1 y rechazarse 4')
    failed = true
} else {
    console.log('OK: solo se creó un ticket')
}

console.log(failed ? '\nResultado: FALLÓ\n' : '\nResultado: TODO OK\n')
process.exitCode = failed ? 1 : 0
