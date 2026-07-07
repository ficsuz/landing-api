# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`nest-starter-template` — a production-oriented NestJS 11 starter. Stack: Prisma 7 + PostgreSQL, BullMQ/Redis queues, Socket.IO (Redis adapter), MinIO object storage, JWT + Google OAuth, Winston logging, i18n (`nestjs-i18n`, en/ru/uz). Package manager is **yarn**. Default port is **5001**.

**Before writing or changing feature code, read [`ARCHITECTURE.md`](./ARCHITECTURE.md)** — it is the authoritative coding-style + module blueprint guide (file layout, controller/service/DTO conventions, the single `AppException`, i18n, the response envelope, and hard rules for code generation). This file is the high-level map; `ARCHITECTURE.md` is the how-to. Match the existing modules exactly; do not invent new patterns.

## Commands

```bash
yarn start:dev            # watch-mode dev server
yarn start:debug          # watch + inspector
yarn build                # nest build -> dist/
yarn start:prod           # node dist/main

yarn lint                 # eslint --fix
yarn lint:check           # eslint, no fix
yarn format               # prettier --write

yarn test                 # jest unit tests (*.spec.ts under src/)
yarn test:watch
yarn test:cov
yarn test:e2e             # uses test/jest-e2e.json

# run a single unit test:
yarn test path/to/file.spec.ts
yarn test -t "test name substring"

# Prisma (config lives in prisma/prisma.config.ts)
yarn prisma:generate      # regenerate the Prisma client after schema edits
yarn prisma:migrate       # migrate dev
yarn prisma:seed          # tsx prisma/seed.ts
yarn prisma:studio
```

Jest config is inline in `package.json` (`rootDir: src`, `testRegex: .*\.spec\.ts$`). Husky runs `pretty-quick --staged` on pre-commit.

## Architecture

### Layout
- `src/modules/<feature>/` — **flat module layout** (NestJS-standard): `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts` at the module root, plus `dto/` and (optional) `interfaces/`, `strategies/`, `handlers/` subfolders. There are **no** `controllers/`/`services/` subfolders. Features: `auth`, `users`, `roles`, `files`, `jobs`. **All modules follow the same blueprint — see "Module Blueprint" below and `ARCHITECTURE.md`. When adding a model/feature, copy this shape exactly.**
- `src/common/` — cross-cutting code: `services/` (prisma, redis, env, mail, minio, logger, socket-gateway), `guards/`, `decorators/`, `filters/`, `interceptors/`, `exceptions/`, `utils/`, `constants/`.
- `prisma/` — `schema.prisma`, `seed.ts`, `prisma.config.ts`. No `migrations/` dir is currently checked in.

### Module Blueprint (every feature module is identical in shape)
```
src/modules/<feature>/
  <feature>.module.ts        # wires controller + service; imports deps (PrismaModule is @Global)
  <feature>.controller.ts    # THIN: @ApiTags + guards + routes; returns service output verbatim
  <feature>.service.ts       # all logic; talks to Prisma; returns PLAIN data (never the envelope)
  dto/
    create-<feature>.dto.ts   # request DTO (class-validator + @ApiProperty)
    update-<feature>.dto.ts   # = PartialType(CreateDto) from @nestjs/swagger
    <feature>-response.dto.ts # response DTO (@ApiProperty); the Swagger contract, excludes secrets
  interfaces/                 # internal TS contracts (optional)
```
Rules enforced across all modules (full guide in `ARCHITECTURE.md`):
- **Controllers are thin** — `@Controller({ path: RESOURCES.X, version: '1' })`, never build the response envelope (the global `TransformInterceptor` does), `@Param('id', ParseUUIDPipe)`, and **every** route has `@ApiOperation` + an envelope-aware response decorator from `@common/decorators/api-response.decorator`: `@ApiOkData(Dto)` / `@ApiCreatedData(Dto)` (single), `@ApiOkArray(Dto)` (array), `@ApiPaginatedResponse(Dto)` (lists), `@ApiMessageResponse({ description })` (no data), `@ApiNoContentResponse()` (204). These document the real `{ success, …, data, … }` envelope — do NOT use the bare `@ApiOkResponse({ type })`. Standard error responses (401/403/404/422/500) are auto-injected into every endpoint by `setupSwagger`, so you never document errors by hand (see ARCHITECTURE.md §6).
- **Status codes** — creating `POST` → 201 (default); non-creating `POST` (login, assign, retry…) → `@HttpCode(HttpStatus.OK)`; `DELETE` → `@HttpCode(HttpStatus.NO_CONTENT)` + service returns `void`.
- **Services return plain data** — objects/arrays, or `paginate(data, total, page, limit)` (`@common/utils/api-response.util`) for lists; shape output with Prisma `select` so secrets never leak; throw domain errors as a single `AppException(ErrorCodes.X)` (`@common/exceptions/app.exception` + `@common/constants/error-codes`) — never raw `@nestjs/common` HTTP exceptions, ad-hoc strings, or hardcoded messages. Status + localized message are derived from the code.

### Path aliases (tsconfig)
Only `@common/*`, `@modules/*`, `@config/*` (→ `src/common/config/*`). Import utils via `@common/utils`, guards via `@common/guards/...`.

### Request/response pipeline (configured globally in `src/main.ts`)
- **URI versioning**: prefix `api/v`, default version `1`. Routes resolve to `/api/v1/<resource>`. Controllers set `path` from the `RESOURCES` constant and `version: '1'`.
- **Global `I18nValidationPipe`**: `whitelist + forbidNonWhitelisted + transform` with implicit conversion. Unknown body fields are rejected; DTOs must declare every accepted field with class-validator decorators, localized via `i18nValidationMessage('validation.KEY')`. Validation failures become a `422` with a per-field `error.details` array.
- **Global `TransformInterceptor`**: wraps every successful handler return value in the `IApiResponse` envelope (`{ success, message, data, error, meta }` — the HTTP status is not duplicated in the body) via `buildSuccessResponse`. It passes the value through untouched if it already has both `success` and `meta`. Services return raw data; the only builders are `buildSuccessResponse`/`buildErrorResponse` in `@common/utils/api-response.util` (used by the interceptor and filter respectively).
- **Global `HttpExceptionFilter`** (`@Catch()`, registered via `APP_FILTER` so it can inject `I18nService` + `LoggerService`): normalizes `AppException`, i18n validation errors, Prisma errors (e.g. `P2002` → `DUPLICATE_ENTRY`), framework `HttpException`s, and unknown errors into the same error envelope — translating the message to the request language and logging via Winston (sanitized). **Server-side failures are opaque**: any 5xx that isn't a deliberate `AppException` (unknown/Prisma/framework errors) is collapsed to a generic `INTERNAL_SERVER_ERROR` with no `details` — the real cause is logged only and traceable via `meta.requestId` (generated when absent). The HTTP status lives on the status line, not in the body.

### Errors & localization (i18n)
- Authoritative guide in `ARCHITECTURE.md` §"Errors & localization" and §6. Library: `nestjs-i18n`.
- **One exception:** `throw new AppException(ErrorCodes.X, { args?, details?, cause? })`. `args` interpolate into the message; `details` are structured context in `error.details`; `cause` is for logs.
- **Adding an error = 3 edits:** a code in `@common/constants/error-codes.ts`, its HTTP status in `@common/errors/error-catalog.ts`, and the `errors.<CODE>` text in **every** locale under `src/i18n/<lang>/errors.json` (`en`, `ru`, `uz`).
- **Language** resolves from `?lang` → `x-lang` header → `Accept-Language`, falling back to `DEFAULT_LANGUAGE` (`.env`, default `en`). i18n JSON is copied to `dist` via `nest-cli.json` (`assets`/`watchAssets`). `error.code` is the stable machine identity; the message is localized.

### Auth & RBAC
Authorization is **role + permission based** (normalized RBAC): `Users ──< UserRoles >── Roles ──< RolePermissions >── Permissions`. A user's roles come **only** from `UserRoles` (there is no `users.role` column); permissions come **only** through roles (there is no direct user→permission table).

Controllers opt in with a **two-guard chain**, order matters:
```ts
@UseGuards(JwtAuthGuard, AuthGuard)            // applied per-controller; there is NO global guard
@RequireRoles(ROLES.ADMIN, ROLES.USER)         // any-of these roles (@common/decorators/roles.decorator)
@RequirePermissions('user:create')             // all-of these permission keys (permissions.decorator)
```
- `JwtAuthGuard` (`passport-jwt`) validates the bearer token and sets `request.user`.
- `AuthGuard` rejects unverified users, lets `super_admin` bypass everything, then enforces **both** `@RequireRoles` (user needs any of them) **and** `@RequirePermissions` (user needs all of the keys, resolved via `RolesService.getUserPermissions`). No decorator ⇒ any authenticated+verified user passes.
- A permission's identity is its **`key`** (`'<resource>:<action>'`, e.g. `user:create`). Catalog lives in `@common/constants` (`PERMISSION_RESOURCES`, `PERMISSION_ACTIONS`, `permissionKey`, `PERMISSION_KEYS`); `ROLES`/`RESOURCES` (route paths) are also there. Get the session with `@User()` (`IUserSession`).
- Tokens are signed in `AuthService.generateTokens` with secrets/expiries from `EnvService` (access + refresh each have a TTL). Every token carries a `sessionId`; **the refresh token lives on the `UserSessions` row** as a sha256 hash (`refreshTokenHash`) — there is no separate refresh-token table. `JwtStrategy.validate` checks the session is active in the DB; refresh rotates (revoke old session + issue new); logout/reset revoke via `isActive:false` + `revokedAt`. OTPs are stored hashed (`otpHash`). All session writes are scoped to the current `userId`.

### Database (Prisma + pg adapter)
- `PrismaService` extends `ExtendedPrismaClient` (`prisma.client.ts`), a plain `PrismaClient` over a `pg` `Pool` via `@prisma/adapter-pg`. `PrismaModule` is `@Global` — depend on the singleton; never list `PrismaService` in another module's `providers` (it spawns a second pool).
- **PKs are `uuid(7)`**; columns map to snake_case via `@map`; strings are `text` (lengths enforced in DTOs). **`updatedAt` uses `@updatedAt`** and auto-updates — do **not** pass `updatedAt: new Date()` manually.
- **Soft-delete + audit only on domain entities** (`Users`, `Roles`, `Permissions`, `Files`): they carry `isDeleted`/`deletedAt` + `createdById`/`updatedById`/`deletedById` (loose UUIDs, no FK). Filter `where: { isDeleted: false }` and "delete" via `isDeleted: true` + `deletedById`. **System/ephemeral/join tables are lean** (no soft-delete): sessions/codes use `isActive`/`revokedAt`/`consumedAt`; join tables (`UserRoles`, `RolePermissions`) use composite PKs (`@@id([...])`) — replace via `deleteMany` + `createMany`, never soft-delete.
- Models are PascalCase-plural (`Users`, `Roles`) accessed lower-cased (`this.prisma.users`). `findUnique`/`update` accept an extra non-unique filter (`{ id, isDeleted: false }`) in Prisma 7 — intentional. Run `yarn prisma:generate` after schema edits.

### Jobs: sequential step processing (`src/modules/jobs`)
Built on **BullMQ** (`@nestjs/bullmq`; queue name `job-processing`). The data model is a clean parent/child: a **`Jobs`** row is one pipeline *run* that owns an ordered set of **`JobSteps`**. It models a GitHub-Actions-style pipeline: `JobsService.createJob` writes the job + all step rows up front (PENDING) and enqueues **only the first** step; each step, on success, enqueues the next. A failed step (after BullMQ retries are exhausted) halts the run.
- **`JobsService`** = orchestration only (create / list / get / retry, and `enqueueStep`); it never runs handler code. **`JobsProcessor`** (`WorkerHost`) is the worker — each BullMQ job runs exactly **one** step, carrying only `{ jobId, stepId }` (everything else is read from the DB). Steps retry with exponential backoff (`STEP_MAX_ATTEMPTS`); a step is marked `FAILED` only once attempts run out (`@OnWorkerEvent('failed')`).
- **`Jobs.type` and `JobSteps.type` are plain strings** (generic). An `IStepHandler` declares the `type` it serves; all handlers are collected under the `STEP_HANDLERS` token and indexed by `StepRegistryService` (no manual registration). To add one: implement `IStepHandler`, list the class in `JobsModule` providers + the `STEP_HANDLERS` factory `inject`. Module constants live in `jobs.constants.ts`. Each step's result is forwarded to the next via `IStepContext.previousResult`.
- `userId` comes from the **session** (not the request body); step status changes are pushed over WebSocket to a room named after `userId`. **Retry re-enqueues** the failed step — it never runs work in the HTTP request.

### WebSockets & Redis
Socket.IO gateway (`common/services/socket-gateway`) uses the Redis adapter for horizontal scaling and authenticates connections via `gateway-auth.service`. Redis also backs Bull and session/cache concerns.

### Configuration — single source of truth
`EnvService` (`@common/services/env/env.service`) is the **only** config surface. It's a class-validator schema validated once at boot via `ConfigModule.forRoot({ validate })` (in `app.module.ts`), so a missing/invalid var fails fast. Inject it and read typed values with `env.get('KEY')` (or `env.isProduction`). Modules needing config at construction use `forRootAsync`/`registerAsync` with `inject: [EnvService]`; the few non-DI spots (`prisma.client.ts`, `main.ts` adapter wiring) read what they must explicitly.
- Add a new variable in **one place**: `EnvService` (+ `.env.example`). Do **not** read `process.env` directly elsewhere, and do **not** reintroduce a second env module (a leftover `@common/env` and a `JWT_CONSTANTS` block were removed in the consolidation).
- The health endpoint is `GET /health` (version-neutral, used by the Docker healthcheck); all other routes are under `/api/v1`.

## Lint specifics that affect code you write
- `@typescript-eslint/no-explicit-any` is an **error project-wide** — never write `any`; use `unknown` + narrowing, a Prisma/library type (e.g. `Prisma.JsonValue` / `Prisma.InputJsonValue`, `LogData`), or a real `interface`. `*.service.ts` and `*.controller.ts` additionally make `require-await` an **error** (it's a warning elsewhere).
- Prettier: single quotes, trailing commas (`all`), `printWidth: 100`, 2-space tabs, semicolons. Prefix intentionally-unused vars/args with `_`.
