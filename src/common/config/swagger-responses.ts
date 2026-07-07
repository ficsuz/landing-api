import { OpenAPIObject } from '@nestjs/swagger';
import { ErrorCodes } from '@common/constants/error-codes';
import { IApiError, IApiResponse } from '@common/interfaces/api-response.interface';

/**
 * Reference (documentation) data for the standard error responses that the
 * `HttpExceptionFilter` can produce. Used both to auto-inject error responses
 * into every Swagger operation (see `injectStandardErrorResponses`) and by the
 * `@ApiErrorResponse()` decorator. The messages mirror the English i18n catalog.
 */
export const STANDARD_ERRORS: Record<number, { code: string; message: string; details?: unknown }> =
  {
    400: { code: ErrorCodes.BAD_REQUEST, message: 'The request is invalid.' },
    401: { code: ErrorCodes.UNAUTHORIZED, message: 'Authentication is required.' },
    403: {
      code: ErrorCodes.FORBIDDEN,
      message: 'You do not have permission to perform this action.',
    },
    404: { code: ErrorCodes.RESOURCE_NOT_FOUND, message: 'The requested resource was not found.' },
    409: { code: ErrorCodes.DUPLICATE_ENTRY, message: 'This record already exists.' },
    422: {
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'The submitted data is invalid.',
      details: [{ field: 'email', messages: ['email must be a valid email address.'] }],
    },
    500: {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong. Please try again later.',
    },
  };

const SCHEMA_REF = '#/components/schemas/ApiErrorResponseDto';

/** A fully-shaped error envelope example for the given status (for Swagger). */
export function errorEnvelopeExample(
  status: number,
  path = '/api/v1/resource',
): IApiResponse<null> {
  const def = STANDARD_ERRORS[status] ?? STANDARD_ERRORS[500];
  return {
    success: false,
    message: def.message,
    data: null,
    error: { code: def.code, details: (def.details as IApiError['details']) ?? null },
    meta: { timestamp: '2024-01-01T00:00:00.000Z', path },
  };
}

/** An OpenAPI response object for a standard error status. */
export function errorResponseObject(status: number): Record<string, unknown> {
  const def = STANDARD_ERRORS[status] ?? STANDARD_ERRORS[500];
  return {
    description: def.message,
    content: {
      'application/json': {
        schema: { $ref: SCHEMA_REF },
        example: errorEnvelopeExample(status),
      },
    },
  };
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

/**
 * Walk the generated OpenAPI document and add the standard error responses to
 * every operation that doesn't already declare them — so endpoints never have
 * to document errors by hand. Heuristics:
 * - `500` on everything.
 * - `401` + `403` when the operation is secured (bearer auth).
 * - `422` when the operation accepts a request body.
 * - `404` when the operation has a path parameter.
 * An explicitly-declared response for a status is never overwritten.
 */
interface OpenApiOperation {
  responses?: Record<string, unknown>;
  security?: unknown[];
  requestBody?: unknown;
  parameters?: Array<{ in?: string }>;
}

export function injectStandardErrorResponses(document: OpenAPIObject): void {
  const paths = (document.paths ?? {}) as unknown as Record<
    string,
    Record<string, OpenApiOperation | undefined>
  >;
  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem?.[method];
      if (!op) continue;

      op.responses = op.responses ?? {};
      const add = (status: number) => {
        const key = String(status);
        if (!op.responses![key]) op.responses![key] = errorResponseObject(status);
      };

      const secured = Array.isArray(op.security) && op.security.length > 0;
      const hasBody = Boolean(op.requestBody);
      const hasPathParam = Array.isArray(op.parameters)
        ? op.parameters.some((p) => p?.in === 'path')
        : false;

      if (secured) {
        add(401);
        add(403);
      }
      if (hasBody) add(422);
      if (hasPathParam) add(404);
      add(500);
    }
  }
}

/**
 * Reference the given (apiKey) security scheme from every operation so Swagger UI
 * sends it on all requests once it's set in the "Authorize" dialog — used to make
 * the language header settable once globally rather than per-endpoint.
 *
 * Run this AFTER `injectStandardErrorResponses`: it would otherwise make every
 * operation look "secured" and wrongly attach 401/403 to public endpoints. The
 * scheme is merged into each existing requirement (kept alongside bearer auth).
 */
export function injectGlobalSecurityScheme(document: OpenAPIObject, scheme: string): void {
  const paths = (document.paths ?? {}) as unknown as Record<
    string,
    Record<string, OpenApiOperation | undefined>
  >;
  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem?.[method];
      if (!op) continue;

      const requirements = (op.security as Array<Record<string, string[]>>) ?? [];
      if (requirements.length === 0) {
        op.security = [{ [scheme]: [] }];
      } else {
        for (const requirement of requirements) requirement[scheme] = [];
      }
    }
  }
}
