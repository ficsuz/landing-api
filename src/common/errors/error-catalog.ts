import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodes } from '@common/constants/error-codes';

/**
 * The single source of truth mapping every {@link ErrorCode} to the HTTP status
 * it resolves to. The human-facing message is NOT stored here — it lives in the
 * i18n catalog at `errors.<CODE>` and is resolved per-request by language in the
 * global exception filter. Keeping status here + text in i18n is what makes an
 * error both localizable and consistent.
 */
export const ERROR_STATUS: Record<ErrorCode, HttpStatus> = {
  // System
  [ErrorCodes.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCodes.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCodes.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.INVALID_OPERATION]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,

  // Database
  [ErrorCodes.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCodes.DUPLICATE_ENTRY]: HttpStatus.CONFLICT,
  [ErrorCodes.FOREIGN_KEY_VIOLATION]: HttpStatus.CONFLICT,

  // Authentication & session
  [ErrorCodes.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.TOKEN_INVALID]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.SESSION_EXPIRED]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.REFRESH_TOKEN_INVALID]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.GOOGLE_ONLY_ACCOUNT]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.OAUTH_FAILED]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.INVALID_GOOGLE_PROFILE]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.TOO_MANY_ATTEMPTS]: HttpStatus.TOO_MANY_REQUESTS,

  // Authorization
  [ErrorCodes.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: HttpStatus.FORBIDDEN,

  // OTP / verification / reset
  [ErrorCodes.OTP_INVALID]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.OTP_EXPIRED]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.OTP_GENERATION_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCodes.VERIFICATION_FAILED]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.RESET_CODE_INVALID]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.RESET_CODE_EXPIRED]: HttpStatus.UNAUTHORIZED,

  // Users
  [ErrorCodes.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.USER_EMAIL_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCodes.USER_INACTIVE]: HttpStatus.FORBIDDEN,
  [ErrorCodes.USER_NOT_VERIFIED]: HttpStatus.FORBIDDEN,

  // Roles & permissions
  [ErrorCodes.ROLE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.ROLE_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCodes.PERMISSION_NOT_FOUND]: HttpStatus.NOT_FOUND,

  // Files
  [ErrorCodes.FILE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.FILE_TOO_LARGE]: HttpStatus.PAYLOAD_TOO_LARGE,
  [ErrorCodes.FILE_UPLOAD_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCodes.FILE_FETCH_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,

  // Queue
  [ErrorCodes.STEP_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.JOB_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.INVALID_STEP_TYPE]: HttpStatus.BAD_REQUEST,

  // Content (CMS)
  [ErrorCodes.EVENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.NEWS_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.COUNCIL_MEMBER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.TESTIMONIAL_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.BLOG_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.EXPERT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.REPORT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.DOCUMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.DOCUMENT_CATEGORY_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.DOCUMENT_CATEGORY_IN_USE]: HttpStatus.CONFLICT,
  [ErrorCodes.CHRONOLOGY_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.COUNCIL_CALENDAR_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.TEAM_MEMBER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.MEMBER_NOT_FOUND]: HttpStatus.NOT_FOUND,
};

/** i18n message key for a code: `errors.<CODE>`. */
export const errorMessageKey = (code: ErrorCode): string => `errors.${code}`;

/** HTTP status for a code, defaulting to 500 for an unknown/unmapped code. */
export const errorStatus = (code: ErrorCode): HttpStatus =>
  ERROR_STATUS[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
