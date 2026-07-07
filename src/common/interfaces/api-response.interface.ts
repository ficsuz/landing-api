import { ApiProperty } from '@nestjs/swagger';

/**
 * One field's validation failures, as surfaced in `error.details` for a 422
 * validation error. `field` is the (possibly dotted) property path.
 */
export interface IFieldError {
  field: string;
  messages: string[];
}

export interface IApiError {
  /** Machine-readable, stable error code (see `ErrorCodes`). */
  code: string;
  /**
   * Structured extra context. For validation errors this is `IFieldError[]`;
   * for domain errors it is whatever was passed to `AppException`'s `details`.
   */
  details?: IFieldError[] | Record<string, unknown> | null;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface IApiMeta {
  timestamp: string;
  path: string;
  requestId?: string;
  pagination?: IPaginationMeta;
}

/**
 * The single response envelope used for BOTH success and error responses. The
 * `TransformInterceptor` builds the success form; the `HttpExceptionFilter`
 * builds the error form — they share this exact shape so clients parse one
 * contract.
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: IApiError | null;
  meta: IApiMeta;
}

// ── Swagger documentation models ─────────────────────────────────────────────
// One DTO cannot carry a single coherent example for BOTH success and error, so
// the contract is documented as two models: `ApiResponseDto` (success) and
// `ApiErrorResponseDto` (error). Pagination is documented only on list
// endpoints (via `@ApiPaginatedResponse`), so it never leaks into these base
// examples.

class ApiMetaDto {
  @ApiProperty({ example: '2024-03-12T12:00:00.000Z' }) timestamp: string;
  @ApiProperty({ example: '/api/v1/users' }) path: string;
  @ApiProperty({ required: false, example: 'req_01HXR3Z8K7Q1' }) requestId?: string;
}

class ApiErrorDto implements IApiError {
  @ApiProperty({ example: 'USER_NOT_FOUND' }) code: string;
  @ApiProperty({
    required: false,
    nullable: true,
    example: null,
    description:
      'Structured context. For a 422 validation error this is an array of `{ field, messages }`; otherwise null.',
  })
  details?: IFieldError[] | Record<string, unknown> | null;
}

/** Swagger model for a SUCCESS response (`error` is always null). */
export class ApiResponseDto<T = unknown> implements IApiResponse<T> {
  @ApiProperty({ example: true }) success: boolean;
  @ApiProperty({ example: 'Operation successful' }) message: string;
  @ApiProperty({
    nullable: true,
    description: 'Endpoint payload (typed per endpoint); null for message-only responses.',
  })
  data: T | null;
  @ApiProperty({ example: null, nullable: true, description: 'Always null on success.' })
  error: IApiError | null;
  @ApiProperty({ type: ApiMetaDto }) meta: IApiMeta;
}

/** Swagger model for an ERROR response (`data` is always null, `error` populated). */
export class ApiErrorResponseDto {
  @ApiProperty({ example: false }) success: boolean;
  @ApiProperty({ example: 'User not found.' }) message: string;
  @ApiProperty({ nullable: true, example: null, description: 'Always null on error.' })
  data: unknown;
  @ApiProperty({ type: ApiErrorDto }) error: IApiError;
  @ApiProperty({ type: ApiMetaDto }) meta: IApiMeta;
}
