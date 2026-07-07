import { HttpException } from '@nestjs/common';
import { ErrorCode } from '@common/constants/error-codes';
import { errorMessageKey, errorStatus } from '@common/errors/error-catalog';

export interface AppExceptionOptions {
  /**
   * Interpolation values for the localized message, e.g.
   * `{ args: { minutes: 5 } }` for a message `"... try again in {minutes} min"`.
   */
  args?: Record<string, unknown>;
  /**
   * Structured, machine-readable extra info surfaced verbatim in
   * `response.error.details` (NOT localized). Use for things like the offending
   * ids. Avoid leaking secrets.
   */
  details?: unknown;
  /** Underlying error, kept for logs only — never sent to the client. */
  cause?: unknown;
}

/**
 * The one exception every feature throws. HTTP status comes from the error
 * catalog and the message is resolved by the request's language in the global
 * `HttpExceptionFilter` — so call sites never hardcode status codes or English
 * strings.
 *
 *   throw new AppException(ErrorCodes.USER_NOT_FOUND);
 *   throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { args: { id } });
 *   throw new AppException(ErrorCodes.FILE_TOO_LARGE, { args: { limit: '40MB' } });
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly args?: Record<string, unknown>;
  readonly details?: unknown;

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    super(
      {
        code,
        messageKey: errorMessageKey(code),
        args: options.args,
        details: options.details,
      },
      errorStatus(code),
      { cause: options.cause as Error | undefined },
    );

    this.code = code;
    this.args = options.args;
    this.details = options.details;
  }
}
