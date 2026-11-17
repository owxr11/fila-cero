// npm run check:firestore --workspace=@filacero/api
import { db } from '../src/config/firebase.js'

try {
    const collections = await db.listCollections()

    console.log('Conexión con Firestore correcta ✅')
    console.log(
        'Colecciones:',
        collections.length ? collections.map((collection) => collection.id).join(', ') : '(ninguna todavía)'
    )
    process.exit(0)
} catch (error) {
    console.error('No se pudo conectar con Firestore ❌')
    console.error(error.message)
    process.exit(1)
}
