# Contrato técnico FilaCero

Acuerdo que permite que los 5 integrantes trabajen **en paralelo sin depender unos de otros**.
Si alguien necesita cambiar algo de aquí, lo avisa al equipo **antes** de hacerlo.

El estilo de código sigue el del proyecto del curso `nodejs-monorepo` (E-Commerce):
módulos por carpeta con `routes → controller → service → repository` y `schema` con zod.

## Reglas de trabajo

- Ramas: `main` (estable) ← `develop` (integración) ← `feature/*` (trabajo de cada quien).
- Cada quien crea su rama **desde `develop`** y abre un **Pull Request hacia `develop`**.
- Cada quien edita **solo sus carpetas / archivos** (tabla de abajo).
- Nunca subir `.env`, llaves privadas ni el JSON de la cuenta de servicio.
- Todo acceso a Firestore se hace **desde la API**. El frontend solo habla con la API.
- Fechas en Firestore con `FieldValue.serverTimestamp()`. `dayKey` = `YYYY-MM-DD` en `America/Mexico_City`.

## Responsables

| Integrante | Rama | API (`apps/api/...`) | Web (`apps/web/...`) |
|---|---|---|---|
| 1 · Autenticación y roles | `feature/autenticacion-roles` | `src/modules/auth/`, `src/modules/users/`, `src/shared/security/password.js`, `src/config/permissions.js`, `scripts/seed-users.js` | `pages/login.vue`, `pages/register.vue`, `stores/auth.ts`, `middleware/*.ts` |
| 2 · Catálogo de servicios y módulos | `feature/catalogo-servicios-modulos` | `src/modules/services/`, `src/modules/counters/`, `scripts/seed-catalog.js` | `pages/admin/`, `stores/catalog.ts` |
| 3 · Emisión de tickets | `feature/emision-tickets` | `src/modules/tickets/` | `pages/index.vue`, `stores/tickets.ts` |
| 4 · Consulta de turnos y tablero | `feature/consulta-turnos-tablero` | `src/modules/queue/`, `firebase/firestore.indexes.json` | `pages/ticket/[id].vue`, `pages/board.vue`, `pages/operator/` |
| 5 · Documentación y entrega R1 | `feature/documentacion-r1` | `firebase/firestore.rules`, `src/docs/openapi.js` (revisar) | `README.md`, `docs/**`, `evidencias/**` |

Archivos **base que ya están listos** (no modificarlos sin avisar):
`src/app.js`, `src/server.js`, `src/routes/index.js`, `src/config/env.js`, `src/config/firebase.js`,
`src/config/auth.js`, `src/config/logger.js`, `src/shared/**` (excepto `security/password.js`),
`apps/web/composables/useApi.ts`, `apps/web/types/api.ts`, `apps/web/app.vue`, `apps/web/components/AppHeader.vue`.

Cada integrante, al implementar su módulo, **reemplaza** el `router.use(notImplemented(...))` de su `*.routes.js`
por sus rutas reales.

## Estructura de un módulo (ejemplo: `services`)

```
src/modules/services/
  service.routes.js       rutas + middlewares (authenticate, authorize, validate)
  service.controller.js   lee req.validated y responde { success, data, meta }
  service.service.js      reglas de negocio, lanza AppError
  service.repository.js   único lugar que usa Firestore (db.collection(...))
  service.schema.js       schemas zod con { body, params, query }
```

```js
// service.routes.js
router.post('/',
    authenticate,
    authorize('services:create'),
    validate(schema.createServiceSchema),
    asyncHandler(controller.createService)
)
```

Herramientas compartidas:

```js
import { db, COLLECTIONS } from '../../config/firebase.js'
import { FieldValue } from 'firebase-admin/firestore'
import { AppError } from '../../shared/errors/app-errors.js'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'

throw new AppError({ statusCode: 404, code: 'SERVICE_NOT_FOUND', message: 'Servicio no encontrado' })
```

```ts
// Web
const api = useApi()
const services = await api.request<Service[]>('/services')
await api.request('/services', { method: 'POST', body: payload, auth: true })
```

## Probar endpoints protegidos sin esperar el login

`authenticate` y `authorize` **ya funcionan**. Mientras Integrante 1 termina el login, cualquiera genera
un token de prueba:

```bash
npm run dev:token -- ADMIN       # o OPERATOR / VISITOR
```

y lo usa en Postman / Thunder Client con el header `Authorization: Bearer <token>`.

## Formato de respuestas

```json
{ "success": true, "data": { }, "meta": { "requestId": "..." } }
{ "success": true, "data": [ ], "meta": { "count": 3, "requestId": "..." } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ ] }, "meta": { "requestId": "..." } }
```

Códigos HTTP: 200, 201, 204, 400 `VALIDATION_ERROR`, 401 `AUTH_REQUIRED` / `INVALID_ACCESS_TOKEN`,
403 `FORBIDDEN`, 404 `*_NOT_FOUND`, 409 `*_EXISTS` / conflicto, 501 `NOT_IMPLEMENTED`, 500.

## Roles y permisos

Roles: `VISITOR`, `OPERATOR`, `ADMIN` (en `src/config/permissions.js`).

| Permiso | VISITOR | OPERATOR | ADMIN |
|---|---|---|---|
| `services:create`, `services:update` | | | ✅ |
| `counters:read` | | ✅ | ✅ |
| `counters:create`, `counters:update` | | | ✅ |
| `tickets:read`, `tickets:update` (R2) | | ✅ | ✅ |

Emitir un ticket y consultar su estado es **público** (el visitante no necesita cuenta).

## Modelo Firestore

Para R1 hay una sola organización con id `demo`.

| Colección | Id del documento | Campos |
|---|---|---|
| `organizations` | `demo` | `name`, `address`, `active`, `createdAt`, `updatedAt` |
| `users` | automático | `name`, `email` (minúsculas), `passwordHash`, `role`, `active`, `createdAt`, `updatedAt` |
| `refreshTokens` | automático | `userId`, `tokenHash`, `revoked`, `createdAt` |
| `services` | automático | `orgId`, `name`, `prefix` (1 letra mayúscula, única: `"A"`), `active`, `createdAt`, `updatedAt` |
| `counters` (módulos) | automático | `orgId`, `name` (`"Módulo 1"`), `serviceIds` (array), `active`, `createdAt`, `updatedAt` |
| `tickets` | automático | `orgId`, `serviceId`, `serviceName`, `number` (int), `code` (`"A-007"`), `dayKey` (`"2026-11-19"`), `status`, `counterId`, `createdAt`, `calledAt`, `startedAt`, `finishedAt` |
| `dailyStats` | `{serviceId}_{dayKey}` | `serviceId`, `dayKey`, `lastNumber` (int), `issued` (int) |
| `serviceEvents` | automático | `ticketId`, `serviceId`, `type`, `actorId`, `at` |

- `tickets.status`: `WAITING` → `CALLED` → `IN_SERVICE` → `DONE`, o `CANCELLED`. En R1 solo se usa `WAITING`.
- `serviceEvents.type`: `CREATED`, `CALLED`, `STARTED`, `FINISHED`, `CANCELLED`.
- `counterId`, `calledAt`, `startedAt`, `finishedAt` se crean en `null`.
- **Número único** (Integrante 3): dentro de `db.runTransaction(...)` se lee `dailyStats/{serviceId}_{dayKey}`,
  se incrementa `lastNumber`, y en la misma transacción se crean el ticket y el evento `CREATED`.

## Endpoints (prefijo `/api/v1`)

| Método | Ruta | Acceso | Body / query | `data` de la respuesta | Resp. |
|---|---|---|---|---|---|
| GET | `/health` | público | — | `{ status: "ok", ... }` | listo ✅ |
| POST | `/auth/register` | público | `{ name, email, password }` | `{ user, accessToken, refreshToken }` | 1 |
| POST | `/auth/login` | público | `{ email, password }` | `{ user, accessToken, refreshToken }` | 1 |
| POST | `/auth/refresh` | público | `{ refreshToken }` | `{ accessToken, refreshToken }` | 1 |
| GET | `/auth/me` | autenticado | — | `user` (sin `passwordHash`) | 1 |
| GET | `/services` | público | — | `Service[]` | 2 |
| GET | `/services/:id` | público | — | `Service` | 2 |
| POST | `/services` | `services:create` | `{ name, prefix, active? }` | `Service` (201) | 2 |
| PATCH | `/services/:id` | `services:update` | `{ name?, prefix?, active? }` | `Service` | 2 |
| GET | `/counters` | `counters:read` | — | `Counter[]` | 2 |
| POST | `/counters` | `counters:create` | `{ name, serviceIds, active? }` | `Counter` (201) | 2 |
| PATCH | `/counters/:id` | `counters:update` | `{ name?, serviceIds?, active? }` | `Counter` | 2 |
| POST | `/tickets` | público | `{ serviceId }` | `Ticket` (201) | 3 |
| GET | `/queue/tickets/:id` | público | — | `{ id, code, serviceName, status, ahead }` | 4 |
| GET | `/queue` | público | `?serviceId=` | `{ serviceId, dayKey, current, waiting: [{ id, code, number }] }` | 4 |

Los tipos de TypeScript de todo esto ya están en `apps/web/types/api.ts`.

Documentación interactiva (Swagger): `http://localhost:4050/api-docs`. Cada quien agrega ahí sus endpoints.

## Datos de prueba sin depender de otros

- Integrantes 3 y 4: mientras llega el seed de Integrante 2, crear a mano en la consola de Firestore un servicio
  (`services`: `{ orgId: "demo", name: "Caja", prefix: "A", active: true }`).
- Integrante 4: mientras llega el POST de Integrante 3, crear tickets a mano con la forma de la tabla de arriba.
