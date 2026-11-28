import { vi } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'demo-filacero'
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret'

// authenticate revisa en Firestore que el usuario siga activo; en las pruebas se da por válido.
// tests/session.test.js prueba la versión real.
vi.mock('../src/shared/security/session.js', () => ({
    verifySession: vi.fn(async () => undefined),
    forgetSession: vi.fn()
}))
