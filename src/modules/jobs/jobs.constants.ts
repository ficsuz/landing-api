/**
 * Module-level constants for the background-jobs pipeline. Kept out of the
 * interface file so types and values live in separate, single-purpose modules.
 */

// BullMQ queue + job names — the single source of truth for the queue identity.
export const JOB_QUEUE_NAME = 'job-processing';
export const PROCESS_STEP_JOB = 'process-step';

// Retry policy applied to every step job (wired in JobsModule defaultJobOptions).
// A step that throws is retried with exponential backoff; only when attempts are
// exhausted is the step — and the run — marked FAILED.
export const STEP_MAX_ATTEMPTS = 3;
export const STEP_BACKOFF_DELAY = 1000;

// Fallback pipeline type when a job is created without an explicit one.
export const DEFAULT_JOB_TYPE = 'pipeline';

// DI token collecting every step handler provider; StepRegistryService indexes
// them by `handler.type` so the processor can resolve a handler for a step.
export const STEP_HANDLERS = Symbol('STEP_HANDLERS');

// Built-in / demo step types. The pipeline is generic: a step `type` is a plain
// string, so applications register handlers under any string key.
export const STEP_TYPES = {
  WEBSITE_LOADING: 'website_loading',
} as const;
