import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ValidationError } from 'class-validator';
import { Response } from 'express';
import { I18nContext, I18nService, I18nValidationException } from 'nestjs-i18n';

import { ErrorCode, ErrorCodes } from '@common/constants/error-codes';
import { errorMessageKey, errorStatus } from '@common/errors/error-catalog';
import { AppException } from '@common/exceptions/app.exception';
import { IApiError, IFieldError } from '@common/interfaces/api-response.interface';
import { IRequest } from '@common/interfaces/request.interface';
import { EnvService } from '@common/services/env/env.service';
import { LoggerService } from '@common/services/logger/logger.service';
import { buildErrorResponse } from '@common/utils/api-response.util';
import { uuid } from '@common/utils';

/** What every exception is normalized into before building the envelope. */
interface NormalizedError {
  statusCode: number;
  code: string;
  /** i18n key for the human message (`errors.<CODE>`). */
  messageKey: string;
  /** Interpolation args for the message. */
  args?: Record<string, unknown>;
  /** Structured extra context surfaced in `error.details`. */
  details?: IApiError['details'];
}

/** Generic NestJS/framework HttpExceptions mapped to a localizable code. */
const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCodes.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCodes.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCodes.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCodes.RESOURCE_NOT_FOUND,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCodes.SERVICE_UNAVAILABLE,
};

/** Prisma engine error codes mapped to our error codes. */
const PRISMA_TO_CODE: Record<string, ErrorCode> = {
  P2002: ErrorCodes.DUPLICATE_ENTRY,
  P2003: ErrorCodes.FOREIGN_KEY_VIOLATION,
  P2025: ErrorCodes.RESOURCE_NOT_FOUND,
};

/**
 * The single global error handler. Every thrown exception — `AppException`,
 * i18n validation errors, Prisma errors, framework `HttpException`s and unknown
 * errors — is normalized here into the one error envelope, with its message
 * localized to the request language. Registered via `APP_FILTER` in AppModule
 * so it can inject `I18nService` and `LoggerService`.
 */
@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly i18n: I18nService,
    private readonly logger: LoggerService,
    private readonly env: EnvService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<IRequest>();
    const lang = I18nContext.current()?.lang ?? this.env.get('DEFAULT_LANGUAGE');

    // Every error response carries a requestId the client can quote; the same id
    // is set on the request so the server log line below matches it. This is how
    // an opaque 5xx stays traceable without leaking the cause to the client.
    const requestId = (request.headers['x-request-id'] as string) || uuid();
    request.headers['x-request-id'] = requestId;

    const normalized = this.sanitize(this.normalize(exception), exception);
    const message = this.translate(normalized.messageKey, lang, normalized.args);

    const body = buildErrorResponse({
      message,
      error: { code: normalized.code, details: normalized.details ?? null },
      path: request.url,
      requestId,
    });

    this.log(normalized, message, exception, request);
    response.status(normalized.statusCode).json(body);
  }

  // ── Normalization ─────────────────────────────────────────────────────────

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof I18nValidationException) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: ErrorCodes.VALIDATION_ERROR,
        messageKey: errorMessageKey(ErrorCodes.VALIDATION_ERROR),
        details: this.flattenValidationErrors(exception.errors),
      };
    }

    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        messageKey: errorMessageKey(exception.code),
        args: exception.args,
        details: (exception.details as IApiError['details']) ?? null,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const code = PRISMA_TO_CODE[exception.code] ?? ErrorCodes.DATABASE_ERROR;
      return {
        statusCode: errorStatus(code),
        code,
        messageKey: errorMessageKey(code),
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const code =
        STATUS_TO_CODE[statusCode] ??
        (statusCode >= 500 ? ErrorCodes.INTERNAL_SERVER_ERROR : ErrorCodes.BAD_REQUEST);
      return { statusCode, code, messageKey: errorMessageKey(code) };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      messageKey: errorMessageKey(ErrorCodes.INTERNAL_SERVER_ERROR),
    };
  }

  /**
   * Keep server-side failures opaque to clients. A 5xx that is NOT a deliberate
   * `AppException` is a bug or infra failure (unknown error, Prisma fault,
   * framework 500): collapse it to a generic, stable error with no message
   * detail and no `details`, so nothing about the internal cause leaks. The real
   * error is still logged in full and is traceable via the response `requestId`.
   * Deliberate `AppException`s are developer-curated and pass through unchanged.
   */
  private sanitize(normalized: NormalizedError, exception: unknown): NormalizedError {
    const isServerError = normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
    if (isServerError && !(exception instanceof AppException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        messageKey: errorMessageKey(ErrorCodes.INTERNAL_SERVER_ERROR),
        details: null,
      };
    }
    return normalized;
  }

  /** Flatten (possibly nested) class-validator errors into `IFieldError[]`. */
  private flattenValidationErrors(errors: ValidationError[], parent = ''): IFieldError[] {
    const result: IFieldError[] = [];
    for (const err of errors) {
      const field = parent ? `${parent}.${err.property}` : err.property;
      if (err.constraints) {
        result.push({ field, messages: Object.values(err.constraints) });
      }
      if (err.children?.length) {
        result.push(...this.flattenValidationErrors(err.children, field));
      }
    }
    return result;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private translate(key: string, lang: string, args?: Record<string, unknown>): string {
    try {
      const msg = this.i18n.translate(key, { lang, args });
      return typeof msg === 'string' ? msg : key;
    } catch {
      return key;
    }
  }

  private log(
    normalized: NormalizedError,
    message: string,
    exception: unknown,
    request: IRequest,
  ): void {
    const error = exception instanceof Error ? exception : new Error(message);
    if (normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, error as Error, request);
    } else {
      this.logger.warn(
        message,
        {
          code: normalized.code,
          statusCode: normalized.statusCode,
          details: normalized.details ?? undefined,
        },
        request,
      );
    }
  }
}
