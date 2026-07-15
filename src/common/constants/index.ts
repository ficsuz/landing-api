export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// Route path segments consumed by @Controller({ path }). Keep these plural
// (REST convention) — they are NOT the RBAC permission resources below.
export const RESOURCES = {
  AUTH: 'auth',
  USERS: 'users',
  ROLES: 'roles',
  FILES: 'files',
  JOBS: 'jobs',
  // Content (CMS) resources
  EVENTS: 'events',
  COUNCIL: 'council',
  NEWS: 'news',
  TESTIMONIALS: 'testimonials',
  BLOGS: 'blogs',
  EXPERTS: 'experts',
  REPORTS: 'reports',
  DOCUMENTS: 'documents',
  DOCUMENT_CATEGORIES: 'document-categories',
  CHRONOLOGY: 'chronology',
  COUNCIL_CALENDAR: 'council-calendar',
  TEAM: 'team',
  MEMBERS: 'members',
  MEETINGS: 'meetings',
  SPECIAL_PROJECTS: 'special-projects',
} as const;

// ── RBAC permission catalog ───────────────────────────────────
// A permission's canonical identity is its `key`: `${resource}:${action}`,
// e.g. 'user:create'. Use these with @RequirePermissions('user:create').

export const PERMISSION_RESOURCES = {
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  FILE: 'file',
  JOB: 'job',
  // Content (CMS) resources
  EVENT: 'event',
  COUNCIL: 'council',
  NEWS: 'news',
  TESTIMONIAL: 'testimonial',
  BLOG: 'blog',
  EXPERT: 'expert',
  REPORT: 'report',
  DOCUMENT: 'document',
  DOCUMENT_CATEGORY: 'document-category',
  CHRONOLOGY: 'chronology',
  COUNCIL_CALENDAR: 'council-calendar',
  TEAM: 'team',
  MEMBER: 'member',
  MEETING: 'meeting',
  SPECIAL_PROJECT: 'special-project',
} as const;

export const PERMISSION_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN: 'assign',
} as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[keyof typeof PERMISSION_RESOURCES];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

export const permissionKey = (resource: string, action: string): string => `${resource}:${action}`;

// Full catalog of permission keys (resource × action) — used by the seed.
export const PERMISSION_KEYS: string[] = Object.values(PERMISSION_RESOURCES).flatMap((resource) =>
  Object.values(PERMISSION_ACTIONS).map((action) => permissionKey(resource, action)),
);

// ── i18n / localization ───────────────────────────────────────
// Single source of truth for the locales shipped in `src/i18n` and accepted by
// the language resolvers. Used by EnvService validation and the Swagger header.
export const SUPPORTED_LANGUAGES = ['en', 'ru', 'uz'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Request header that overrides the response language (see HeaderResolver in
// AppModule); resolution order is `?lang` → this header → `Accept-Language`.
export const LANGUAGE_HEADER = 'x-lang';

// Swagger security-scheme id under which the language header is exposed in the
// "Authorize" dialog, so it can be set once and applied to every request.
export const LANGUAGE_SECURITY_SCHEME = 'language';
