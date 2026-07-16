import * as Sentry from "@sentry/react";

// Phase 5 Polish: error tracking, gated behind an env var that's unset in dev/test/CI --
// initializing here is a genuine no-op until a real Sentry project's DSN is supplied via
// VITE_SENTRY_DSN, so this can ship now without requiring anyone to have a Sentry account yet.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, environment: import.meta.env.MODE });
}

// Safe to call even when initSentry() was a no-op -- captureException with no active client
// is a documented no-op in the Sentry SDK, not an error. Kept as the one place ErrorBoundary
// (and, if ever needed, a service-layer catch) reports to, mirroring errorHandler.middleware.js's
// single-funnel pattern on the backend.
export function reportError(error, context) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
