//  npm run dev:token --workspace=@filacero/api -- ADMIN
//      npm run dev:token --workspace=@filacero/api -- OPERATOR
import { env } from '../src/config/env.js'
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

const token = signAccessToken({
    sub: `dev-${role.toLowerCase()}`,
    role
})

console.log(`Token de prueba para ${role}:\n`)
console.log(`Authorization: Bearer ${token}`)
