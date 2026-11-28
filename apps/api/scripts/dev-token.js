import { env } from '../src/config/env.js'
import { COLLECTIONS, db } from '../src/config/firebase.js'
import { ROLES } from '../src/config/permissions.js'
import { signAccessToken } from '../src/shared/security/tokens.js'

if (env.NODE_ENV === 'production') {
    console.error('Este script solo se usa en desarrollo')
    process.exit(1)
}

const role = (process.argv[2] ?? 'ADMIN').toUpperCase()

if (!Object.values(ROLES).includes(role)) {
    console.error(`Rol inválido. Usa uno de: ${Object.values(ROLES).join(', ')}`)
    process.exit(1)
}

const snapshot = await db.collection(COLLECTIONS.users)
    .where('role', '==', role)
    .where('active', '==', true)
    .limit(1)
    .get()

if (snapshot.empty) {
    console.error(`No hay un usuario ${role} activo. Corre primero: npm run seed:users`)
    process.exit(1)
}

const user = snapshot.docs[0]
const token = signAccessToken({
    sub: user.id,
    role
})

console.log(`Token de prueba para ${role} (${user.get('email')}):\n`)
console.log(`Authorization: Bearer ${token}`)
process.exit(0)
