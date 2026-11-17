# FilaCero — Administración de filas virtuales y turnos

> Proyecto 06 · Lenguajes Modernos de Programación 2026.
> README base. **Responsable de completarlo para R1: Integrante 5**
> (problema, objetivo, alcance MVP, roles, integrantes, cuentas de prueba).

**Stack:** Node.js 24 · Express 5 · Firebase Admin (Cloud Firestore) · JWT · Zod · Pino · Vitest ·
Nuxt 4 · Pinia · Tailwind CSS 4.

## Requisitos

- Node.js 24 (ver `.nvmrc`) y npm.
- Credenciales de la cuenta de servicio de Firebase del proyecto `fila-cero-p6`
  (se comparten **por privado**, nunca por GitHub).

## Instalación

```bash
git clone https://github.com/owxr11/fila-cero.git
cd fila-cero
git checkout develop
npm install

cp apps/api/.env.example apps/api/.env   # llenar FIREBASE_* y JWT_* (pedir al coordinador)
cp apps/web/.env.example apps/web/.env

npm run check:firestore                  # debe decir: Conexión con Firestore correcta ✅
```

## Ejecución

```bash
npm run dev          # API + Web juntos
npm run dev:api      # API  -> http://localhost:4050/api/v1/health
npm run dev:web      # Web  -> http://localhost:3000
```

Documentación de endpoints (Swagger): http://localhost:4050/api-docs

## Pruebas y calidad

```bash
npm test             # pruebas de la API (Vitest + Supertest)
npm run lint:api     # ESLint de la API
npm run typecheck:web
```

## Utilidades de desarrollo

```bash
npm run dev:token -- ADMIN      # token JWT de prueba para un rol (ADMIN, OPERATOR, VISITOR)
```

## Estructura

```
apps/api/        API REST (Express) — src/modules/<módulo>/ con routes, controller, service, repository, schema
apps/web/        Frontend (Nuxt 4)
firebase/        Reglas e índices de Firestore
docs/            Contrato técnico, arquitectura, modelo y revisiones (docs/revisiones/R1.md ...)
```

## Cómo trabajamos

Leer **[docs/contrato.md](docs/contrato.md)**: responsables, ramas, modelo de datos y endpoints.
