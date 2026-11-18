// Crea (o actualiza) las cuentas de prueba ficticias de cada rol.
// Uso: npm run seed:users
import { ROLES } from '../src/config/permissions.js'
import { hashPassword } from '../src/shared/security/password.js'
import * as userRepository from '../src/modules/users/user.repository.js'

const users = [
    {
        name: 'Administrador Demo',
        email: 'admin@filacero.test',
        password: 'Admin12345',
        role: ROLES.ADMIN
    },
    {
        name: 'Operador Demo',
        email: 'operador@filacero.test',
        password: 'Operador12345',
        role: ROLES.OPERATOR
    },
    {
        name: 'Visitante Demo',
        email: 'visitante@filacero.test',
        password: 'Visitante12345',
        role: ROLES.VISITOR
    }
]

for (const data of users) {
    const passwordHash = await hashPassword(data.password)
    const existing = await userRepository.findByEmail(data.email)

    if (existing) {
        await userRepository.updateUser(existing.id, {
            name: data.name,
            role: data.role,
            passwordHash,
            active: true
        })
        console.log(`Actualizado: ${data.email} (${data.role})`)
    } else {
        await userRepository.createUser({
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            active: true
        })
        console.log(`Creado:      ${data.email} (${data.role})`)
    }
}

console.log('\nCuentas de prueba listas ✅')
process.exit(0)
