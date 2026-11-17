import { env } from '../config/env.js'

// documentación swagger: http://localhost:4050/api-docs
export const openapi = {
    openapi: '3.0.3',
    info: {
        title: 'FilaCero API',
        version: '0.1.0',
        description: 'Administración de filas virtuales y turnos'
    },
    servers: [
        { url: `http://localhost:${env.PORT}${env.API_PREFIX}` }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Estado de la API',
                responses: {
                    200: { description: 'La API está funcionando' }
                }
            }
        }
    }
}
