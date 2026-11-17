import pino from 'pino'
import { env } from './env.js'

const transport =
    env.NODE_ENV === 'production' || env.NODE_ENV === 'test'
        ? undefined
        : pino.transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        })

export const logger = pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL
}, transport)
