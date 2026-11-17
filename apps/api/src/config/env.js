import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const envPath = path.resolve(currentDirectory, '../../.env')

dotenv.config({
    path: envPath,
    quiet: true
})

const port = Number(process.env.PORT ?? 4050)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe ser válido')
}

export const env = Object.freeze({
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: port,
    API_PREFIX: process.env.API_PREFIX ?? '/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
    TIMEZONE: process.env.TIMEZONE ?? 'America/Mexico_City',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
})

if (!env.FIREBASE_PROJECT_ID) {
    throw new Error('Falta la variable de entorno FIREBASE_PROJECT_ID')
}
