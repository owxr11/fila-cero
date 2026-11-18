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
        },
        schemas: {
            Service: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    orgId: { type: 'string', example: 'demo' },
                    name: { type: 'string', example: 'Caja' },
                    prefix: { type: 'string', example: 'A' },
                    active: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time', nullable: true },
                    updatedAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            ServiceInput: {
                type: 'object',
                required: ['name', 'prefix'],
                properties: {
                    name: { type: 'string', minLength: 2, maxLength: 60, example: 'Caja' },
                    prefix: { type: 'string', pattern: '^[A-Z]$', example: 'A' },
                    active: { type: 'boolean', default: true }
                }
            },
            ServiceUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 2, maxLength: 60 },
                    prefix: { type: 'string', pattern: '^[A-Z]$' },
                    active: { type: 'boolean' }
                }
            },
            Counter: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    orgId: { type: 'string', example: 'demo' },
                    name: { type: 'string', example: 'Módulo 1' },
                    serviceIds: { type: 'array', items: { type: 'string' } },
                    active: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time', nullable: true },
                    updatedAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            CounterInput: {
                type: 'object',
                required: ['name', 'serviceIds'],
                properties: {
                    name: { type: 'string', minLength: 2, maxLength: 60, example: 'Módulo 1' },
                    serviceIds: { type: 'array', minItems: 1, items: { type: 'string' } },
                    active: { type: 'boolean', default: true }
                }
            },
            CounterUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 2, maxLength: 60 },
                    serviceIds: { type: 'array', minItems: 1, items: { type: 'string' } },
                    active: { type: 'boolean' }
                }
            },
            // TicketStatus
            TicketStatusView: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    code: { type: 'string', example: 'A-007' },
                    serviceName: { type: 'string', example: 'Caja' },
                    status: { type: 'string', enum: ['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'CANCELLED'] },
                    ahead: { type: 'integer', minimum: 0, example: 3, description: 'Personas delante (tickets WAITING del mismo servicio y día con número menor)' }
                }
            },
            // QueueView: {
            QueueView: {
                type: 'object',
                properties: {
                    serviceId: { type: 'string' },
                    dayKey: { type: 'string', example: '2026-11-19' },
                    current: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            id: { type: 'string' },
                            code: { type: 'string', example: 'A-006' },
                            counterId: { type: 'string', nullable: true }
                        }
                    },
                    waiting: {
                        type: 'array',
                        description: 'Tickets en espera del día, ordenados por número',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                code: { type: 'string', example: 'A-007' },
                                number: { type: 'integer', example: 7 }
                            }
                        }
                    }
                }
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
        },
        '/services': {
            get: {
                tags: ['Servicios'],
                summary: 'Listar servicios',
                parameters: [
                    { name: 'active', in: 'query', required: false, schema: { type: 'string', enum: ['true', 'false'] } }
                ],
                responses: {
                    200: { description: 'Lista de servicios ordenada por prefijo' }
                }
            },
            post: {
                tags: ['Servicios'],
                summary: 'Crear servicio',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceInput' } } }
                },
                responses: {
                    201: { description: 'Servicio creado' },
                    400: { description: 'Datos inválidos' },
                    401: { description: 'Autenticación requerida' },
                    403: { description: 'Sin permiso services:create' },
                    409: { description: 'El prefijo ya está en uso' }
                }
            }
        },
        '/services/{id}': {
            get: {
                tags: ['Servicios'],
                summary: 'Obtener un servicio',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Servicio encontrado' },
                    404: { description: 'Servicio no encontrado' }
                }
            },
            patch: {
                tags: ['Servicios'],
                summary: 'Actualizar servicio',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceUpdate' } } }
                },
                responses: {
                    200: { description: 'Servicio actualizado' },
                    400: { description: 'Datos inválidos' },
                    401: { description: 'Autenticación requerida' },
                    403: { description: 'Sin permiso services:update' },
                    404: { description: 'Servicio no encontrado' },
                    409: { description: 'El prefijo ya está en uso' }
                }
            }
        },
        '/counters': {
            get: {
                tags: ['Módulos'],
                summary: 'Listar módulos de atención',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'active', in: 'query', required: false, schema: { type: 'string', enum: ['true', 'false'] } }
                ],
                responses: {
                    200: { description: 'Lista de módulos' },
                    401: { description: 'Autenticación requerida' },
                    403: { description: 'Sin permiso counters:read' }
                }
            },
            post: {
                tags: ['Módulos'],
                summary: 'Crear módulo',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CounterInput' } } }
                },
                responses: {
                    201: { description: 'Módulo creado' },
                    400: { description: 'Datos inválidos o servicios inexistentes' },
                    401: { description: 'Autenticación requerida' },
                    403: { description: 'Sin permiso counters:create' }
                }
            }
        },
        '/counters/{id}': {
            patch: {
                tags: ['Módulos'],
                summary: 'Actualizar módulo',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CounterUpdate' } } }
                },
                responses: {
                    200: { description: 'Módulo actualizado' },
                    400: { description: 'Datos inválidos o servicios inexistentes' },
                    401: { description: 'Autenticación requerida' },
                    403: { description: 'Sin permiso counters:update' },
                    404: { description: 'Módulo no encontrado' }
                }
            }
        },
        '/tickets': {
            post: {
                tags: ['Tickets'],
                summary: 'Emitir un turno (público)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object', required: ['serviceId'],
                                properties: { serviceId: { type: 'string' } },
                            }
                        }
                    },
                },
                responses: {
                    201: { description: 'Ticket creado (id, code, number, status)' },
                    400: { description: 'Datos inválidos' },
                    404: { description: 'Servicio no encontrado' },
                    409: { description: 'Servicio inactivo' },
                },
            },
        },
        // queue
        '/queue/tickets/{id}': {
            get: {
                tags: ['Cola'],
                summary: 'Consultar un turno: código, servicio, estado y personas delante (público)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'Estado del turno',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { $ref: '#/components/schemas/TicketStatusView' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Id inválido' },
                    404: { description: 'Ticket no encontrado' }
                }
            }
        },
        // código nuevo
        '/queue': {
            get: {
                tags: ['Cola'],
                summary: 'Turno actual y lista de espera del día de un servicio, ordenada por número (público)',
                parameters: [
                    { name: 'serviceId', in: 'query', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'Cola del servicio',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { $ref: '#/components/schemas/QueueView' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'serviceId faltante o inválido' },
                    404: { description: 'Servicio no encontrado' }
                }
            }
        },
    }
}
