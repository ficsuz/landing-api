# 🚀 NestJS Enterprise Starter Template

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A production-ready <a href="http://nestjs.com" target="_blank">NestJS</a> starter with JWT + Google OAuth authentication, role-based access control, file storage, background queues, real-time websockets, and a single type-safe configuration layer.</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node Version" />
  <img src="https://img.shields.io/badge/nestjs-11-red.svg" alt="NestJS Version" />
  <img src="https://img.shields.io/badge/prisma-7-2D3748.svg" alt="Prisma Version" />
  <img src="https://img.shields.io/badge/typescript-5-blue.svg" alt="TypeScript Version" />
</p>

---

## ✨ Features

- **Authentication** — email/password with OTP email verification, JWT access + refresh tokens (both expiring), Google OAuth 2.0, password reset, and DB-backed session tracking with per-user session limits.
- **Authorization (RBAC)** — role-based guards (`user` / `admin` / `super_admin`) with a per-route `@RequireRoles` decorator and a `super_admin` bypass.
- **Type-safe configuration** — one validated `EnvService` is the single source of truth; the app fails fast at boot on a missing/invalid variable.
- **Database** — Prisma 7 over a `pg` connection pool, soft deletes, and standardized audit columns.
- **File storage** — MinIO/S3 uploads & streamed downloads with download-history tracking.
- **Background jobs** — Bull + Redis "step processing" queue that runs a sequence of steps GitHub-Actions style, with real-time progress over websockets.
- **Real-time** — Socket.IO gateway with JWT-authenticated connections and a Redis adapter for horizontal scaling.
- **Observability** — Winston logging (console always on, Elasticsearch optional), a `/health` endpoint, and a consistent JSON response/error envelope.
- **DX** — Swagger UI, ESLint + Prettier, Husky pre-commit formatting, Docker multi-stage build.

## 🧱 Tech Stack

| Concern | Choice |
|---|---|
| Framework | NestJS 11 (Express) |
| Language | TypeScript 5 |
| ORM / DB | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) |
| Auth | Passport (JWT + Google OAuth2), bcrypt |
| Cache / Queue / PubSub | Redis (node-redis), Bull |
| Object storage | MinIO / S3 |
| Realtime | Socket.IO (+ Redis adapter) |
| Mail | Nodemailer + Handlebars templates |
| Logging | Winston (+ optional Elasticsearch) |
| Docs | Swagger / OpenAPI |

## 📋 Prerequisites

- **Node.js** ≥ 18 · **Yarn**
- **PostgreSQL** ≥ 13 · **Redis** ≥ 6
- **MinIO** (or any S3-compatible store) — required for the file module
- An SMTP account — required for OTP/password-reset emails

## 🚀 Quick Start

```bash
# 1. Install
yarn install

# 2. Configure — copy and fill in the values
cp .env.example .env

# 3. Database — generate the client, apply schema, optionally seed
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed        # optional

# 4. Run
yarn start:dev
```

- API base URL: `http://localhost:5001/api/v1`
- Health check: `http://localhost:5001/health`
- Swagger UI: `http://localhost:5001/api/docs` (Basic Auth — `SWAGGER_USER` / `SWAGGER_PASSWORD`)

## 📜 Scripts

```bash
# Development
yarn start:dev          # watch mode
yarn start:debug        # watch + inspector
yarn build              # compile to dist/
yarn start:prod         # node dist/main

# Database (Prisma)
yarn prisma:generate    # regenerate client after schema changes
yarn prisma:migrate     # create/apply a dev migration
yarn prisma:migrate:deploy
yarn prisma:seed
yarn prisma:studio
yarn prisma:rollback    # reset the database (destructive)

# Quality
yarn lint               # eslint --fix
yarn lint:check         # eslint, no fix
yarn format             # prettier --write

# Tests
yarn test               # unit (*.spec.ts under src/)
yarn test path/to.spec.ts        # a single file
yarn test -t "name substring"    # by test name
yarn test:cov           # coverage
yarn test:e2e           # end-to-end (test/jest-e2e.json)
```

## 🗂️ Project Structure

```
src/
├── main.ts                     # bootstrap: pipes, versioning, filters, interceptors, swagger, ws adapter
├── app.module.ts               # root module (global config validation + Bull)
├── app.controller.ts           # GET /health
├── common/                     # cross-cutting code
│   ├── config/                 # swagger setup
│   ├── constants/              # ROLES, PERMISSIONS, RESOURCES, ErrorCodes
│   ├── decorators/             # @User(), @RequireRoles(), @ApiOkData(), ...
│   ├── dto/                    # PaginationDto
│   ├── errors/                 # error-catalog (ErrorCode -> HTTP status)
│   ├── exceptions/             # AppException (the single exception type)
│   ├── filters/                # global HttpExceptionFilter (i18n + envelope)
│   ├── guards/                 # JwtAuthGuard, AuthGuard (RBAC)
│   ├── interceptors/           # TransformInterceptor (response envelope)
│   ├── interfaces/             # shared types + API response shape
│   ├── utils/                  # helpers (dates, otp, encoding, ...)
│   └── services/               # env, prisma, redis, mail, minio, logger, socket-gateway
└── modules/                    # feature modules (flat NestJS-standard layout)
    └── <feature>/
        ├── <feature>.module.ts
        ├── <feature>.controller.ts   # thin
        ├── <feature>.service.ts      # logic + Prisma
        └── dto/                       # request + *-response DTOs
prisma/
├── schema.prisma               # data model
├── prisma.config.ts            # Prisma 7 config (schema path, migrations, seed)
└── seed.ts
```

Every feature module follows the **same blueprint** — see **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for the full convention guide and a copy-paste template for adding a new model/feature. Current features: `auth`, `users`, `roles`, `files`, `queue`.

## 🌍 Environment Variables

All variables are declared and validated in `src/common/services/env/env.service.ts`. Add new config there (and to `.env.example`) — never read `process.env` directly elsewhere. A missing required variable stops the app at boot.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `5001` | |
| `NODE_ENV` | yes | `development` | `development` \| `production` \| `test` |
| `CORS_ORIGIN` | no | `*` | |
| `DATABASE_URL` | yes | — | Postgres connection string |
| `JWT_ACCESS_TOKEN_SECRET` | yes | — | |
| `JWT_REFRESH_TOKEN_SECRET` | yes | — | |
| `JWT_ACCESS_TOKEN_EXPIRATION` | yes | `15m` | e.g. `15m`, `1h` |
| `JWT_REFRESH_TOKEN_EXPIRATION` | yes | `7d` | |
| `REDIS_HOST` / `REDIS_PORT` | yes | — | |
| `REDIS_PASSWORD` | no | — | |
| `GOOGLE_CLIENT_ID` / `_SECRET` / `_CALLBACK_URL` | yes | — | Google OAuth |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` | yes | — | SMTP |
| `SWAGGER_USER` / `SWAGGER_PASSWORD` | no | `admin` / `admin` | protects `/api/docs` |
| `MINIO_ENDPOINT` / `MINIO_PORT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | yes | — | |
| `MINIO_USE_SSL` | no | `false` | |
| `MINIO_BUCKET` | no | `uploads` | |
| `ELASTICSEARCH_NODE` / `_USERNAME` / `_PASSWORD` | no | — | enables ES log shipping when set |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | no | `admin@example.com` / `Admin123!` | used only by `yarn prisma:seed` |

---

## 🏗️ Architecture & Project Logic

### Request lifecycle (configured in `main.ts`)

Every request flows through a fixed pipeline:

1. **URI versioning** — all feature routes are prefixed `/(api/v){version}`, default `v1` → `/api/v1/...`. `GET /health` is version-neutral.
2. **`ValidationPipe`** (global) — `whitelist + forbidNonWhitelisted + transform`. Unknown body fields are rejected, so every DTO must declare its fields with `class-validator` decorators.
3. **Controller → Service** — controllers stay thin; business logic lives in services that depend on `PrismaService` and other infra services.
4. **`TransformInterceptor`** (global) — wraps every successful response in a consistent envelope:
   ```jsonc
   {
     "success": true,
     "statusCode": 200,
     "message": "Operation successful",
     "data": { /* handler return value */ },
     "error": null,
     "meta": { "timestamp": "…", "pagination": { /* when paginated */ } }
   }
   ```
5. **`HttpExceptionFilter`** (global, registered via `APP_FILTER`) — turns any thrown error (the single `AppException`, i18n validation errors, Prisma errors, framework `HttpException`s, or unknown errors) into the same envelope with `success: false`, with the message **localized** to the request language and logged via Winston. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full error + i18n model.

### Configuration

`EnvService` is a `class-validator`-decorated schema validated once at boot via `ConfigModule.forRoot({ validate })`. Inject it anywhere and read typed values with `env.get('KEY')` (or `env.isProduction`). Modules that need config while constructing (JWT, Mailer, MinIO, Bull) use `registerAsync`/`forRootAsync` with `inject: [EnvService]`.

### Authentication & sessions (`modules/auth`)

Routes are under `/api/v1/auth`:

| Method & path | Purpose |
|---|---|
| `POST /register` | Create an **unverified** user, generate an OTP, email it. Returns a `code` + masked email. |
| `POST /email/verify-otp` | Verify `{ code, otp }`, mark the user verified, and return tokens. |
| `POST /email/resend-otp` | Re-issue an OTP for a pending `code`. |
| `POST /login` | Email + password (bcrypt). Returns tokens + user. |
| `POST /refresh` | Rotate the session using a valid refresh token (Bearer access token required). |
| `POST /logout` | Invalidate the current session and its refresh tokens. |
| `POST /password/forgot` | Email a password-reset OTP. |
| `POST /password/reset` | Reset the password with `{ code, otp, newPassword }`; all sessions are invalidated. |
| `GET /google` → `GET /google/callback` | Google OAuth login (auto-links to an existing email). |

**How sessions work:** `generateTokens` signs an access + refresh token (each with its own secret + expiry from `EnvService`) and embeds a `sessionId`. A `UserSessions` row is created that **stores the refresh token as a sha256 hash** (`refreshTokenHash`) — there is no separate refresh-token table. On every request `JwtStrategy.validate` confirms the `sessionId` is active; **refresh** rotates (verify the hash → issue new tokens → revoke the old session), and **logout/password-reset** revoke via `isActive: false` + `revokedAt` — so they genuinely invalidate live tokens. All session writes are scoped to the acting `userId`.

**Abuse protection:** OTP/verification attempts are counted on the user (`verificationAttempt`); after too many, the account is temporarily blocked (`blockedAt`). OTPs are stored **hashed** (`otpHash`) in the DB and cached in Redis with a short TTL.

### Authorization / RBAC (`common/guards`, `modules/roles`)

Normalized RBAC: `Users ──< UserRoles >── Roles ──< RolePermissions >── Permissions`. Roles come only from `UserRoles` (no `users.role` column); permissions come only through roles. Protect a controller with the two-guard chain, then gate routes by role and/or permission:

```ts
@UseGuards(JwtAuthGuard, AuthGuard)        // there is NO global guard — opt in per controller
@RequireRoles(ROLES.ADMIN, ROLES.USER)     // any-of these roles
@RequirePermissions('user:create')         // all-of these permission keys
findAll() { /* ... */ }
```

- `JwtAuthGuard` validates the bearer token and attaches `request.user`.
- `AuthGuard` rejects unverified users, lets `super_admin` bypass everything, then enforces **both** `@RequireRoles` (any-of) **and** `@RequirePermissions` (all-of, resolved via `RolesService.getUserPermissions`). No decorator ⇒ any authenticated + verified user passes.
- A permission's identity is its **`key`** (`'<resource>:<action>'`). Read the session in a handler with `@User()`.

Roles & permissions are managed under `/api/v1/roles` (role CRUD, assign roles to users, assign permissions to roles, list a role's/user's permissions).

### Data layer (`common/services/prisma`, `prisma/schema.prisma`)

- `PrismaService` is a single `@Global` provider (a `PrismaClient` over a `pg` `Pool` via `@prisma/adapter-pg`). Never re-provide it in another module.
- **Conventions:** `uuid(7)` PKs (time-sortable), snake_case columns via `@map`, `text` strings (lengths enforced in DTOs), and `@updatedAt` so `updatedAt` auto-updates (don't set it manually).
- **Soft-delete + audit only on domain entities** (`Users`, `Roles`, `Permissions`, `Files`): `isDeleted` / `deletedAt` + `createdById` / `updatedById` / `deletedById`. Reads filter `where: { isDeleted: false }`; "deletes" set `isDeleted: true` + `deletedById`. System/ephemeral tables (sessions, codes, jobs, steps) and **lean composite-key join tables** (`UserRoles`, `RolePermissions`) carry no soft-delete — sessions/codes revoke via `isActive`/`revokedAt`/`consumedAt`, and joins are replaced with `deleteMany` + `createMany`.
- Models are PascalCase-plural (`Users`, `Roles`) accessed lower-cased (`this.prisma.users`). Run `yarn prisma:generate` after editing the schema.

### File storage (`modules/files`)

`POST /api/v1/files/upload` enforces a 40 MB limit, writes a `Files` record first, uploads the object to MinIO (bucket from `MINIO_BUCKET`), and rolls back the record if the upload fails. `GET /api/v1/files/:id/download` streams the object back and records a `DownloadHistory` entry.

### Background queue (`modules/queue`)

`StepQueueService` is both an injectable service and a Bull `@Processor('step-processing')`. `createStepSequence` writes all `ProcessingSteps` up front but enqueues **only the first** job; each step, on success, enqueues the next (a failed step halts the chain). Step logic is provided by `StepHandler`s registered per `ProcessingStepType`. Status changes are pushed over websockets to a room named after the `userId`.

### Real-time (`common/services/socket-gateway`)

A Socket.IO gateway authenticates each connection with the JWT (from the `Authorization` header or `auth.token`), joins the client to a room keyed by `userId`, and emits progress/notifications there. A Redis adapter is wired in `main.ts` for horizontal scaling (the app still boots if Redis is unavailable, falling back to the in-memory adapter).

## 📚 API Documentation

With the server running: **Swagger UI** at `/api/docs` and the **OpenAPI JSON** at `/api/docs-json` (both Basic-Auth protected via `SWAGGER_USER` / `SWAGGER_PASSWORD`).

## 🐳 Docker

```bash
cp .env.example .env          # configure first
docker-compose up -d          # build + run
docker-compose logs -f
docker-compose down
```

The image is a multi-stage build that runs as a non-root user with a `/health` healthcheck. PostgreSQL, Redis, and MinIO are expected as external services — point the `DATABASE_URL`, `REDIS_*`, and `MINIO_*` variables at them.

## 🤝 Contributing

1. Branch off `main` (`git checkout -b feature/xyz`).
2. Keep `yarn lint:check`, `yarn build`, and tests green.
3. Open a Pull Request.

## 📄 License

UNLICENSED — private starter template. Adapt per project.
