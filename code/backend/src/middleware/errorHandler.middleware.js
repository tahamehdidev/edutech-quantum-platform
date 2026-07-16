import { AppError } from "../errors/index.js";
import { reportError } from "../utils/sentry.js";

// 04-application-architecture.md §6.3 -- registered last in app.js, with no exceptions. The
// `instanceof AppError` branch is the actual safety property: anything not deliberately thrown
// as one of our typed errors (a stray DB error, a null-pointer bug) can never leak internal
// details into a client response, since the only way to reach the client with a specific code
// and message is to have explicitly thrown one of the typed errors yourself.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.field !== null && { field: err.field }),
      },
    });
  }

  console.error("Unhandled error:", err);
  reportError(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}
