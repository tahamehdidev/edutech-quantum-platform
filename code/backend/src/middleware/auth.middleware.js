import { verifyAccessToken } from "../utils/token.js";
import { refreshTokenService } from "../services/refreshToken.service.js";
import { UnauthenticatedError } from "../errors/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 03-security-architecture.md §3.2 -- runs on every route by default; public routes are
// explicitly whitelisted exceptions, not individually opted into auth. A forgotten whitelist
// entry produces an obviously broken (locked) route, noticed immediately; a forgotten per-route
// auth call produces a silently public route, which might never be noticed.
const PUBLIC_ROUTES = [
  { method: "POST", path: "/auth/signup" },
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/refresh" },
  { method: "GET", path: "/health" },
];

function isPublicRoute(req) {
  return PUBLIC_ROUTES.some((route) => route.method === req.method && route.path === req.path);
}

export const authMiddleware = asyncHandler(async (req, res, next) => {
  if (isPublicRoute(req)) return next();

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthenticatedError();
  }
  const token = header.slice("Bearer ".length);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new UnauthenticatedError();
  }

  // The session row this token is paired with must still be un-revoked -- this is what lets
  // logout invalidate an access token immediately rather than waiting out its 15-minute natural
  // expiry (03-security-architecture.md §2.4-2.5). Goes through the service, never the
  // repository directly (04-application-architecture.md §1 -- middleware gets no exception).
  const isActive = await refreshTokenService.isSessionActive(Number(payload.jti));
  if (!isActive) {
    throw new UnauthenticatedError();
  }

  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
});
