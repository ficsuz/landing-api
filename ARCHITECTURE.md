# Architecture & Conventions

This is the **single source of truth for how code is structured** in this project. Every feature module is built the same way. **When you add a model, endpoint, or feature — human or AI — follow this blueprint exactly.** Consistency is the goal: a reviewer should not be able to tell which module a file came from by its style.

> TL;DR for code generation: flat module, thin controller, logic in the service, plain data out (the interceptor wraps it), a typed response DTO per endpoint, RESTful status codes, and domain errors via a single `AppException(ErrorCodes.X)` (status + localized message come from the code). Never invent a new structure.

---

## 1. The layers

```
HTTP request
  → I18nMiddleware     (resolves request language: ?lang / x-lang / Accept-Language)
  → Guards             (JwtAuthGuard + AuthGuard: authn + roles/permissions)
  → I18nValidationPipe (global: whitelist + transform DTOs; localized validation errors)
  → Controller         (thin: routing + Swagger only)
  → Service            (business logic; talks to Prisma)
  → Prisma             (@prisma/adapter-pg)
  ← Service returns PLAIN data (or paginate(...) for lists)
  ← TransformInterceptor wraps it in the IApiResponse envelope
HTTP response   { success, message, data, error, meta }   (HTTP status on the status line)

Errors thrown anywhere → HttpExceptionFilter → same envelope (success:false),
                         message localized to the request language
```

You never build the envelope by hand. Return data from the service; the interceptor does the rest. Both success and error responses use the **same** envelope shape; see §6.

---

## 2. Module file layout (flat, NestJS-standard)

```
src/modules/<feature>/
  <feature>.module.ts          # wires controller + service, imports deps
  <feature>.controller.ts      # thin HTTP layer
  <feature>.service.ts         # business logic + data access
  dto/
    create-<feature>.dto.ts     # request DTO
    update-<feature>.dto.ts     # PartialType(CreateDto)
    <feature>-response.dto.ts   # response DTO (Swagger contract)
  interfaces/                   # optional internal TS contracts
  # auth-only extras: strategies/    jobs-only extras: handlers/
```

Do **not** create `controllers/` or `services/` subfolders. One controller + one service per module is the default; if a module genuinely needs more services, add them flat at the module root (`<feature>-<thing>.service.ts`), as the `auth` module does.

---

## 3. Conventions

### Controllers — thin
- `@ApiTags('<Feature>')` on the class; `@ApiBearerAuth('authorization')` if protected.
- `@Controller({ path: RESOURCES.<X>, version: '1' })` — path comes from `@common/constants` `RESOURCES`, never a hardcoded string.
- Guards opt-in per controller: `@UseGuards(JwtAuthGuard, AuthGuard)` + `@RequireRoles(...)` / `@RequirePermissions('<resource>:<action>')`.
- **No business logic and no envelope building.** Each handler is essentially `return this.service.method(dto)`.
- `@Param('id', ParseUUIDPipe)` for UUID params.
- **Every** route has `@ApiOperation({ summary, description })` **and** an envelope-aware response decorator from `@common/decorators/api-response.decorator` — these document the REAL `{ success, …, data, … }` shape, so you write the data DTO once and the wrapping is generated:
  - `@ApiOkData(Dto)` / `@ApiCreatedData(Dto)` — 200/201 with `data: Dto`
  - `@ApiOkArray(Dto)` — 200 with `data: Dto[]`
  - `@ApiPaginatedResponse(Dto)` — 200 list with `meta.pagination`
  - `@ApiMessageResponse({ description })` — success with `data: null` (e.g. logout/assign)
  - `@ApiNoContentResponse()` (from `@nestjs/swagger`) for 204 `DELETE`; binary streams keep a raw `@ApiResponse`.
  - **Do NOT** use the bare `@ApiOkResponse({ type })` (it documents the un-wrapped DTO and lies about the shape).
  - **Errors are documented automatically** for every endpoint (401/403/404/422/500 by heuristic — see §6); only add `@ApiErrorResponse(status, description)` for a notable extra case (e.g. login → 401).

### Status codes
| Verb / intent | Code | How |
|---|---|---|
| Create a resource (`POST`) | 201 | Nest default — leave it |
| Non-creating `POST` (login, assign, retry, process…) | 200 | `@HttpCode(HttpStatus.OK)` |
| `GET`, `PATCH`, `PUT` | 200 | default |
| `DELETE` | 204 | `@HttpCode(HttpStatus.NO_CONTENT)`; service returns `void` |

### DTOs
- **Request DTOs** (`create-*.dto.ts`): every field declared with a `class-validator` decorator (the global `I18nValidationPipe` rejects unknown fields) + `@ApiProperty`. Localize each rule with `message: i18nValidationMessage('validation.KEY')` (keys live in `src/i18n/<lang>/validation.json`).
- **Update DTOs**: `export class UpdateXDto extends PartialType(CreateXDto) {}` (`PartialType` from `@nestjs/swagger`).
- **Response DTOs** (`*-response.dto.ts`): a class describing exactly what the endpoint returns, each field with `@ApiProperty`. **Never include `password`, `*Hash`, or other secrets.** This is the Swagger contract; the service must shape its return (via Prisma `select`) to match.

### Services
- Inject `PrismaService` (+ others) via the constructor.
- Return **plain domain data** (objects/arrays). For paginated lists return `paginate(data, total, page, limit)` from `@common/utils` (a `PaginatedResult`; the interceptor lifts pagination into `meta`).
- **Never** build the envelope by hand.
- Shape output with Prisma `select` so secrets never leave the service.
- Throw domain errors via the single `AppException` (`@common/exceptions/app.exception`) with a code from `@common/constants/error-codes` (`ErrorCodes`): `throw new AppException(ErrorCodes.USER_NOT_FOUND)`. The HTTP status and the localized message are derived from the code — **do not** pass status codes or English strings, and **do not** use raw `@nestjs/common` HTTP exceptions (`UnauthorizedException`, `ForbiddenException`, …) anymore.
- Stricter lint applies here and in controllers: **no `any`**, and async functions must `await`.

### Pagination
Accept `PaginationDto` (`@common/dto/pagination.dto`) as a `@Query()`. In the service, run the `findMany` + `count` and `return paginate(rows, total, page, limit)`. Annotate the route with `@ApiPaginatedResponse(XResponseDto)`.

### Errors & localization
Throw exactly one exception type: `new AppException(ErrorCodes.X)`. The global `HttpExceptionFilter` renders it into the error envelope with the message localized to the request language.

- `args` interpolate into the message: `new AppException(ErrorCodes.TOO_MANY_ATTEMPTS, { args: { minutes } })`.
- `details` carry structured machine-readable context (e.g. the offending id) surfaced in `error.details`: `new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { id } })`. Keep dynamic values **out** of the human message — messages are static and localized; specifics go in `details`.
- `cause` keeps the original error for logs only: `new AppException(ErrorCodes.FILE_UPLOAD_FAILED, { cause: err })`.

**Adding a new error is three steps:** (1) add a code to `@common/constants/error-codes.ts`; (2) map its HTTP status in `@common/errors/error-catalog.ts`; (3) add the `errors.<CODE>` text to **every** locale in `src/i18n/<lang>/errors.json`. The code (`error.code`) is the stable machine identity; the message is `errors.<CODE>` resolved per request. The filter also localizes framework `HttpException`s (by status) and maps Prisma errors (e.g. `P2002` → `DUPLICATE_ENTRY`), so services never catch or translate those.

### Database (see `CLAUDE.md` for the full data model)
- PKs are `uuid(7)`; columns map to snake_case via `@map`; `updatedAt` uses `@updatedAt` (don't set it manually).
- Soft-delete + audit (`isDeleted`/`deletedAt` + `createdById`/`updatedById`/`deletedById`) **only on domain entities**; system/ephemeral/join tables are lean.
- Run `yarn prisma:generate` after editing `schema.prisma`.

### Naming, files & code style
- **camelCase in TypeScript, snake_case only in the database.** Every TS identifier — variables, parameters, properties, DTO fields, and response keys — is `camelCase`. The *only* place snake_case appears is the physical database: Prisma model **fields stay camelCase** and map to snake_case columns/tables via `@map` / `@@map` (e.g. `createdById String @map("created_by")`, `@@map("user_roles")`). Never expose a snake_case key in a DTO, request body, or API response.
- **Files** are kebab-case with a role suffix: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.dto.ts` (request) / `*-response.dto.ts` (response), `*.guard.ts`, `*.decorator.ts`, `*.interface.ts`, `*.strategy.ts`, `*.handler.ts`. One primary export per file; the class name matches the filename (`users.service.ts` → `UsersService`).
- **Identifiers**: classes/types/enums `PascalCase`; methods/variables/properties `camelCase`; module-level constants `UPPER_SNAKE_CASE`; enum members `UPPER_SNAKE_CASE`. Interfaces are **`I`-prefixed** (`IUser`, `ITokenPayload`, `IPagination`) and live in a module's `interfaces/` folder or `@common/interfaces`.
- **No magic literals.** Route segments come from `RESOURCES`, roles from `ROLES`, permission keys via `permissionKey()` / `PERMISSION_KEYS`, error identities from `ErrorCodes`, durations from `@common/services/redis/durations`. Don't hardcode the strings.
- **Imports**: use the path aliases (`@common/*`, `@modules/*`, `@config/*`) across areas; use relative `./x` only within the same module. Never reach into another module with deep `../../..` paths. No duplicate imports (lint-enforced).
- **Types**: inject dependencies as `private readonly`; prefer Prisma-generated types and `interface` contracts. **`any` is banned project-wide** (lint error) — use `unknown` + narrowing, a Prisma/library type (`Prisma.JsonValue` for JSON read, `Prisma.InputJsonValue` for JSON write, `Prisma.TransactionClient` for `$transaction` callbacks), or a real interface. Let TS infer obvious return types; type the non-obvious.
- **Async**: always `async`/`await` — no `.then()` chains, no floating promises. Async service methods must `await` something (lint-enforced).
- **Comments**: write short block comments that explain *why* (intent/trade-off), as the infra files do — not *what*. No commented-out code; delete dead code instead.
- **Logging**: use NestJS `Logger` / the `LoggerService`, never `console.*` in feature code (`console` is only for the `main.ts` bootstrap banner).
- **Formatting** is Prettier (single quotes, trailing commas `all`, `printWidth: 100`, 2-space indent, semicolons) — run `yarn format`; never hand-format against it.

---

## 4. How to add a new feature module

Example: a `products` resource.

1. **Schema** — add the model to `prisma/schema.prisma` following the conventions (uuid(7), `@map`, `@updatedAt`, soft-delete + audit if it's a domain entity), then `yarn prisma:generate`.
2. **Scaffold** the flat module (you can `nest g resource products --no-spec` and then flatten/adjust, or copy the `users` module):

```ts
// products.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '@common/services/prisma/prisma.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

```ts
// products.controller.ts
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { RequireRoles } from '@common/decorators/roles.decorator';
import { ApiOkData, ApiCreatedData, ApiPaginatedResponse } from '@common/decorators/api-response.decorator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { RESOURCES, ROLES } from '@common/constants';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('Products')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, AuthGuard)
@Controller({ path: RESOURCES.PRODUCTS, version: '1' })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({ summary: 'List products' })
  @ApiPaginatedResponse(ProductResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiOkData(ProductResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedData(ProductResponseDto)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkData(ProductResponseDto)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @RequireRoles(ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
```

```ts
// products.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { PaginationDto } from '@common/dto/pagination.dto';
import { paginate } from '@common/utils/api-response.util';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_SELECT = { id: true, name: true, price: true, createdAt: true } as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ page = 1, limit = 10, search }: PaginationDto) {
    const where = { isDeleted: false, ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.products.findMany({ where, select: PRODUCT_SELECT, take: limit, skip: (page - 1) * limit }),
      this.prisma.products.count({ where }),
    ]);
    return paginate(rows, total, page, limit);
  }

  async findById(id: string) {
    const product = await this.prisma.products.findUnique({ where: { id, isDeleted: false }, select: PRODUCT_SELECT });
    if (!product) throw new AppException(ErrorCodes.RESOURCE_NOT_FOUND, { details: { id } });
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.products.create({ data: dto, select: PRODUCT_SELECT });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.products.update({ where: { id, isDeleted: false }, data: dto, select: PRODUCT_SELECT });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.products.update({ where: { id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
  }
}
```

```ts
// dto/create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductDto {
  @ApiProperty({ example: 'Widget' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  name: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  price: number;
}

// dto/update-product.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
export class UpdateProductDto extends PartialType(CreateProductDto) {}

// dto/product-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() price: number;
  @ApiProperty() createdAt: Date;
}
```

3. Register `ProductsModule` in `app.module.ts`.
4. Add `PRODUCTS: 'products'` to `RESOURCES` in `@common/constants` (and any new permission keys to the RBAC catalog if the resource is access-controlled).
5. Any new error: add the code to `error-codes.ts`, its status to `error-catalog.ts`, and the `errors.<CODE>` text to `src/i18n/en|ru|uz/errors.json`.
6. `yarn build && yarn lint:check` must pass.

---

## 5. Hard rules for AI / code generation

- **Do not introduce a new folder structure or layering.** Match the blueprint above. No `controllers/`/`services/` subfolders, no repository layer unless the whole project adopts one.
- **Controllers never** contain business logic, build the response envelope, or return raw Prisma entities that include secrets.
- **Services never** import `@nestjs/common` HTTP-response helpers or build the envelope; they return plain data and throw `AppException`.
- **One exception type only:** `AppException(ErrorCodes.X)`. No raw `UnauthorizedException`/`BadRequestException`/`throw new Error(...)` in feature code.
- **No `any`, anywhere.** It's a project-wide lint error. Reach for `unknown` + narrowing, a Prisma/library type, or a real interface instead.
- **No hardcoded user-facing strings.** Error text lives in `src/i18n/*/errors.json`; validation text in `validation.json` via `i18nValidationMessage`. Every code must have a key in **all** locales.
- **Config** comes only from `EnvService` (`env.get('KEY')`); never read `process.env` directly (except the few documented bootstrap spots).
- **Every** endpoint: `@ApiOperation` + a typed `@Api*Response`. **Every** UUID param: `ParseUUIDPipe`. **Every** list: `PaginationDto` + `paginate()`.
- After any change, `yarn build` and `yarn lint:check` must be green.

---

## 6. The response envelope & localization

One envelope for success and error (built centrally — never by hand):

The HTTP status code is **not** duplicated in the body — the HTTP status line is
its single source of truth. Clients branch on `success` + `error.code`.

```jsonc
// success
{ "success": true, "message": "Operation successful",
  "data": { /* ... */ }, "error": null,
  "meta": { "timestamp": "…", "path": "/api/v1/users", "requestId": "…", "pagination": { "total": 100, "page": 1, "limit": 10, "lastPage": 10, "hasPrev": false, "hasNext": true } } }

// error  (message localized to the request language)
{ "success": false, "message": "User not found.",
  "data": null,
  "error": { "code": "USER_NOT_FOUND", "details": null },
  "meta": { "timestamp": "…", "path": "/api/v1/users/42", "requestId": "…" } }

// validation error → error.details is a per-field array
{ "success": false, "message": "The submitted data is invalid.",
  "data": null,
  "error": { "code": "VALIDATION_ERROR",
             "details": [ { "field": "email", "messages": ["email must be a valid email address."] } ] },
  "meta": { "timestamp": "…", "path": "/api/v1/auth/login" } }

// server-side failure (5xx that isn't a deliberate AppException) → OPAQUE:
// generic code + message, details null. The real cause is in the server logs
// only, traceable via meta.requestId. Nothing about the internals is leaked.
{ "success": false, "message": "Something went wrong. Please try again later.",
  "data": null,
  "error": { "code": "INTERNAL_SERVER_ERROR", "details": null },
  "meta": { "timestamp": "…", "path": "/api/v1/users/42", "requestId": "req-id-to-quote" } }
```

- **Building blocks:** types in `@common/interfaces/api-response.interface.ts` (`IApiResponse`, `ApiResponseDto` for Swagger); builders `buildSuccessResponse` / `buildErrorResponse` + `paginate` in `@common/utils/api-response.util.ts`. `TransformInterceptor` builds success; `HttpExceptionFilter` builds errors. These are the *only* two callers.
- **Language resolution** (`I18nModule` in `AppModule`): `?lang=ru` → `x-lang: ru` header → `Accept-Language` → fallback `DEFAULT_LANGUAGE` (`.env`, default `en`). A locale missing a key falls back to `en`.
- **Translation files** live in `src/i18n/<lang>/{errors,validation,messages}.json` and are copied to `dist` by `nest-cli.json` (`assets` + `watchAssets`). Namespaces map to key prefixes: `errors.*`, `validation.*`, `messages.*`. Interpolate with `{name}` and class-validator specifics with `{property}` / `{constraints.0}` / `{value}`.

### Swagger documents the envelope automatically
The Swagger contract reflects the envelope above without hand-writing it twice:
- **Success** is wrapped by the response decorators in `@common/decorators/api-response.decorator.ts` (`ApiOkData`/`ApiCreatedData`/`ApiOkArray`/`ApiPaginatedResponse`/`ApiMessageResponse`). Each builds an `allOf` of `ApiResponseDto` + your DTO as `data` via `getSchemaPath`. You annotate the data type once.
- **Errors** are injected for *every* operation by `injectStandardErrorResponses` (`@common/config/swagger-responses.ts`), called in `setupSwagger` after `createDocument`. Heuristics: `500` always; `401`+`403` when the op is secured; `422` when it has a request body; `404` when it has a path parameter. So no endpoint declares error responses by hand. The example bodies live in `STANDARD_ERRORS`; reach for `@ApiErrorResponse(status)` only to add an extra case the heuristic misses.

This means a new endpoint's full, accurate docs (enveloped success + standard errors) come for free from one success decorator.
