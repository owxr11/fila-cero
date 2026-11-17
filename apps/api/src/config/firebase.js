import {
    cert,
    getApps,
    initializeApp
} from 'firebase-admin/app'

import {
    getFirestore
} from 'firebase-admin/firestore'

import { env } from './env.js'

if (
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_CLIENT_EMAIL ||
    !env.FIREBASE_PRIVATE_KEY
) {
    throw new Error('Faltan variables de entorno de Firebase (ver apps/api/.env.example)')
}

const firebaseApp =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        })

export const db = getFirestore(firebaseApp)

export const COLLECTIONS = Object.freeze({
    organizations: 'organizations',
    users: 'users',
    refreshTokens: 'refreshTokens',
    services: 'services',
    counters: 'counters',
    tickets: 'tickets',
    dailyStats: 'dailyStats',
    serviceEvents: 'serviceEvents'
})
