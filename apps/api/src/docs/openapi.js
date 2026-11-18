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
        },
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Registrar una cuenta (rol VISITOR)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password'],
                                properties: {
                                    name: { type: 'string', example: 'Ana López' },
                                    email: { type: 'string', example: 'ana@filacero.test' },
                                    password: { type: 'string', minLength: 8, example: 'Secreta123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Usuario creado con su accessToken y refreshToken' },
                    400: { description: 'Datos inválidos' },
                    409: { description: 'El correo ya está registrado' }
                }
            }
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Iniciar sesión',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'admin@filacero.test' },
                                    password: { type: 'string', example: 'Admin12345' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Sesión iniciada: { user, accessToken, refreshToken }' },
                    401: { description: 'Correo o contraseña incorrectos' }
                }
            }
        },
        '/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Renovar tokens con el refreshToken',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['refreshToken'],
                                properties: { refreshToken: { type: 'string' } }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Nuevos accessToken y refreshToken' },
                    401: { description: 'Refresh token inválido o revocado' }
                }
            }
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Cerrar sesión (revoca el refreshToken)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['refreshToken'],
                                properties: { refreshToken: { type: 'string' } }
                            }
                        }
                    }
                },
                responses: {
                    204: { description: 'Sesión cerrada' }
                }
            }
        },
        '/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Datos del usuario autenticado',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Usuario actual (sin passwordHash)' },
                    401: { description: 'Token ausente o inválido' }
                }
            }
        }
    }
}
