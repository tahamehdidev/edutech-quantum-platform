import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ACCESS_TOKEN_TTL } from "../config/security.js";

// jti is set to the paired RefreshToken row's id (03-security-architecture.md §2.2) -- stringified
// since JWT's registered `jti` claim is conventionally a string, even though our DB column is an
// integer; callers looking it back up must Number(payload.jti) before querying.
export function signAccessToken({ userId, role, email, jti }) {
  return jwt.sign({ sub: userId, role, email, jti: String(jti) }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

// Throws on invalid/expired signature -- callers (auth.middleware.js) catch and convert to
// UnauthenticatedError, never leaking the underlying jsonwebtoken error to the client.
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

// The refresh token itself is not a JWT (03-security-architecture.md §2.3) -- an opaque random
// value, only ever checked for existence/validity by looking up its hash.
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Only a hash is ever stored (01-data-model.md's RefreshToken note) -- same principle as
// User.password_hash. SHA-256 is sufficient here (not argon2/bcrypt): the value being hashed is
// already a high-entropy random token, not a low-entropy human password, so there's no offline
// brute-force risk to slow down against.
export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
