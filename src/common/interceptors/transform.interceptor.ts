import { IApiResponse } from '@common/interfaces/api-response.interface';
import { PaginatedResult } from '@common/interfaces/pagination.interface';
import { buildSuccessResponse } from '@common/utils/api-response.util';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const DEFAULT_SUCCESS_MESSAGE = 'Operation successful';

/**
 * Localized success message for a status code: `messages.CREATED` for 201,
 * otherwise `messages.SUCCESS`. Falls back to {@link DEFAULT_SUCCESS_MESSAGE}
 * when there is no active i18n context (uses the `I18nContext` static, so no DI).
 */
function resolveSuccessMessage(statusCode: number): string {
  const i18n = I18nContext.current();
  if (!i18n) {
    return DEFAULT_SUCCESS_MESSAGE;
  }
  const key = statusCode === HttpStatus.CREATED ? 'messages.CREATED' : 'messages.SUCCESS';
  const message = i18n.t(key);
  return typeof message === 'string' ? message : DEFAULT_SUCCESS_MESSAGE;
}

function isEnvelope(value: unknown): value is IApiResponse<unknown> {
  return typeof value === 'object' && value !== null && 'success' in value && 'meta' in value;
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PaginatedResult<unknown>).data) &&
    typeof (value as PaginatedResult<unknown>).pagination === 'object' &&
    (value as PaginatedResult<unknown>).pagination !== null
  );
}

/**
 * Wraps every successful handler return value in the standard `IApiResponse`
 * envelope.
 * - A value already in envelope form is passed through untouched.
 * - A `PaginatedResult` ({ data, pagination }) has its pagination lifted into
 *   `meta` and its items become the envelope `data`.
 * - Anything else becomes the envelope `data` directly.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = (request.headers?.['x-request-id'] as string) || undefined;

    return next.handle().pipe(
      map((value) => {
        // Binary streams (file downloads) are sent as-is — never enveloped.
        if (value instanceof StreamableFile) {
          return value as unknown as IApiResponse<T>;
        }

        if (isEnvelope(value)) {
          return value as IApiResponse<T>;
        }

        const message = resolveSuccessMessage(response.statusCode);

        if (isPaginatedResult(value)) {
          return buildSuccessResponse(value.data, {
            path: request.url,
            requestId,
            message,
            pagination: value.pagination,
          }) as IApiResponse<T>;
        }

        return buildSuccessResponse(value, {
          path: request.url,
          requestId,
          message,
        });
      }),
    );
  }
}
