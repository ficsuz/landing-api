import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ApiErrorResponseDto, ApiResponseDto } from '@common/interfaces/api-response.interface';
import { errorEnvelopeExample, STANDARD_ERRORS } from '@common/config/swagger-responses';

type Model = Type<unknown>;

interface DataResponseOptions {
  status?: number;
  description?: string;
  isArray?: boolean;
}

/**
 * These decorators document the REAL response shape: the standard envelope
 * (`{ success, message, data, error, meta }`) with `data` typed to
 * your DTO — instead of the bare DTO. Write the data type once; the wrapping is
 * generated for you. Errors are auto-documented globally (see
 * `injectStandardErrorResponses`); use `@ApiErrorResponse()` only for an extra,
 * endpoint-specific error.
 */
function dataEnvelopeSchema(model: Model, isArray: boolean): SchemaObject {
  const data = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return { allOf: [{ $ref: getSchemaPath(ApiResponseDto) }, { properties: { data } }] };
}

/** Core: document a handler that returns `model` (or `model[]`) inside the envelope. */
export function ApiDataResponse(model: Model, options: DataResponseOptions = {}) {
  const { status = HttpStatus.OK, description, isArray = false } = options;
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({ status, description, schema: dataEnvelopeSchema(model, isArray) }),
  );
}

/** 200 with `data: Model`. */
export const ApiOkData = (model: Model, description?: string) =>
  ApiDataResponse(model, { status: HttpStatus.OK, description });

/** 201 with `data: Model`. */
export const ApiCreatedData = (model: Model, description?: string) =>
  ApiDataResponse(model, { status: HttpStatus.CREATED, description });

/** 200 with `data: Model[]` (non-paginated array). */
export const ApiOkArray = (model: Model, description?: string) =>
  ApiDataResponse(model, { status: HttpStatus.OK, isArray: true, description });

/**
 * 200 with `data: Model[]` and `meta.pagination` populated. Return
 * `paginate(...)` from the service. Replaces the old standalone helper.
 */
export function ApiPaginatedResponse(model: Model, description = 'Successfully retrieved list') {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status: HttpStatus.OK,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: { type: 'array', items: { $ref: getSchemaPath(model) } },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  path: { type: 'string' },
                  requestId: { type: 'string' },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      lastPage: { type: 'number' },
                      hasPrev: { type: 'boolean' },
                      hasNext: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
}

/** Envelope response with no `data` (message-only success, e.g. logout/assign). */
export function ApiMessageResponse(options: { status?: number; description?: string } = {}) {
  const { status = HttpStatus.OK, description } = options;
  return applyDecorators(
    ApiExtraModels(ApiResponseDto),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          { properties: { data: { nullable: true, example: null } } },
        ],
      },
    }),
  );
}

/**
 * Document an endpoint-specific error response in the standard error envelope.
 * Most errors (401/403/404/422/500) are injected automatically; reach for this
 * only when an endpoint has a notable extra case (e.g. login → 401).
 */
export function ApiErrorResponse(status: number, description?: string) {
  return applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ApiResponse({
      status,
      description: description ?? STANDARD_ERRORS[status]?.message ?? 'Error',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
          example: errorEnvelopeExample(status),
        },
      },
    }),
  );
}
