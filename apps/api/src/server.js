import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'

const server = app.listen(env.PORT, () => {
    logger.info({
        port: env.PORT,
        environment: env.NODE_ENV
    }, `FilaCero API corriendo en http://localhost:${env.PORT}${env.API_PREFIX}`)
})

let shuttingDown = false

function shutdown(signal) {
    if (shuttingDown) {
        return
    }

    shuttingDown = true
    logger.info({ signal }, 'Inicia proceso de apagado')

    server.close((error) => {
        if (error) {
            logger.error({ err: error }, 'Error al apagar el servidor')
            process.exit(1)
        }
        logger.info('Servidor HTTP cerrado')
        process.exit(0)
    })

    setTimeout(() => {
        logger.error('Forzando apagado después de 10 segundos')
        process.exit(1)
    }, 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
