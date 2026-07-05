import { UnauthenticatedError, ForbiddenError } from "../errors/index.js";

// 03-security-architecture.md §3.3. Answers "does this user's role permit this type of action at
// all" -- a single-column check, distinct from the per-resource ownership checks added starting
// Milestone 2.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive guard: unreachable if the global auth middleware ran correctly, but prevents a
      // raw 500 (reading .role off undefined) if a future route is misconfigured into the public
      // whitelist while still calling requireRole.
      return next(new UnauthenticatedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
