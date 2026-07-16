import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

// Phase 5 Polish: mirrors the frontend's utils/sentry.js -- a genuine no-op until env.SENTRY_DSN
// is set, so this ships now without requiring a Sentry account/project to exist yet.
export function initSentry() {
  if (!env.SENTRY_DSN) return;
  Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
}

// Safe to call even when initSentry() was a no-op -- captureException with no active client is
// a documented no-op in the Sentry SDK, not an error.
export function reportError(error) {
  Sentry.captureException(error);
}
