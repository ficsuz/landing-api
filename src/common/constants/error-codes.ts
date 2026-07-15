/**
 * Canonical machine-readable error codes.
 *
 * A code is the stable identity of an error surfaced to clients in
 * `response.error.code`. It is ALSO the i18n message-key suffix: the localized
 * message for a code lives at `errors.<CODE>` in `src/i18n/<lang>/errors.json`.
 * So adding an error is three steps: add a code here, map its HTTP status in
 * `error-catalog.ts`, add the `errors.<CODE>` text to every locale.
 *
 * Throw with the single `AppException`:
 *   throw new AppException(ErrorCodes.USER_NOT_FOUND);
 *   throw new AppException(ErrorCodes.TOO_MANY_ATTEMPTS, { args: { minutes } });
 */
export const ErrorCodes = {
  // ── System (5xx / generic) ───────────────────────────────────
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_OPERATION: 'INVALID_OPERATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // ── Database ─────────────────────────────────────────────────
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',

  // ── Authentication & session ─────────────────────────────────
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  GOOGLE_ONLY_ACCOUNT: 'GOOGLE_ONLY_ACCOUNT',
  OAUTH_FAILED: 'OAUTH_FAILED',
  INVALID_GOOGLE_PROFILE: 'INVALID_GOOGLE_PROFILE',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',

  // ── Authorization ────────────────────────────────────────────
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // ── OTP / email verification / password reset ────────────────
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_GENERATION_FAILED: 'OTP_GENERATION_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  RESET_CODE_INVALID: 'RESET_CODE_INVALID',
  RESET_CODE_EXPIRED: 'RESET_CODE_EXPIRED',

  // ── Users ────────────────────────────────────────────────────
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EMAIL_EXISTS: 'USER_EMAIL_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
  USER_NOT_VERIFIED: 'USER_NOT_VERIFIED',

  // ── Roles & permissions ──────────────────────────────────────
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  ROLE_ALREADY_EXISTS: 'ROLE_ALREADY_EXISTS',
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',

  // ── Files ────────────────────────────────────────────────────
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_FETCH_FAILED: 'FILE_FETCH_FAILED',

  // ── Queue / step processing ──────────────────────────────────
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  INVALID_STEP_TYPE: 'INVALID_STEP_TYPE',

  // ── Content (CMS) ────────────────────────────────────────────
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  NEWS_NOT_FOUND: 'NEWS_NOT_FOUND',
  COUNCIL_MEMBER_NOT_FOUND: 'COUNCIL_MEMBER_NOT_FOUND',
  TESTIMONIAL_NOT_FOUND: 'TESTIMONIAL_NOT_FOUND',
  BLOG_NOT_FOUND: 'BLOG_NOT_FOUND',
  EXPERT_NOT_FOUND: 'EXPERT_NOT_FOUND',
  REPORT_NOT_FOUND: 'REPORT_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  DOCUMENT_CATEGORY_NOT_FOUND: 'DOCUMENT_CATEGORY_NOT_FOUND',
  DOCUMENT_CATEGORY_IN_USE: 'DOCUMENT_CATEGORY_IN_USE',
  CHRONOLOGY_NOT_FOUND: 'CHRONOLOGY_NOT_FOUND',
  COUNCIL_CALENDAR_NOT_FOUND: 'COUNCIL_CALENDAR_NOT_FOUND',
  TEAM_MEMBER_NOT_FOUND: 'TEAM_MEMBER_NOT_FOUND',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  MEETING_NOT_FOUND: 'MEETING_NOT_FOUND',
  SPECIAL_PROJECT_NOT_FOUND: 'SPECIAL_PROJECT_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
