import { refreshTokenRepository } from "../repositories/refreshToken.repository.js";
import { generateRefreshToken, hashToken, signAccessToken } from "../utils/token.js";
import { REFRESH_TOKEN_TTL_DAYS } from "../config/security.js";

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Issues a new session row + its paired access token -- used by both login and post-rotation
// reissue, so the two flows can't drift apart on how a session gets created.
async function issue({ userId, role, email }) {
  const rawToken = generateRefreshToken();
  const session = await refreshTokenRepository.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: addDays(new Date(), REFRESH_TOKEN_TTL_DAYS),
  });
  const accessToken = signAccessToken({ userId, role, email, jti: session.id });
  return { rawToken, accessToken, session };
}

// Single-use rotation (03-security-architecture.md §2.6). Returns the just-revoked row on
// success so the caller (auth.service.js) can look up the user and issue() a fresh session: null
// on failure. On failure, also detects reuse-of-an-already-rotated-token as a compromise signal
// and revokes every session for that user -- distinct from "never existed"/"expired", which get
// the same null return but no side effect.
async function rotate(rawToken) {
  const tokenHash = hashToken(rawToken);
  const rotated = await refreshTokenRepository.revokeIfActiveByHash(tokenHash);
  if (rotated) return rotated;

  const existing = await refreshTokenRepository.findByHash(tokenHash);
  if (existing && existing.revoked_at !== null) {
    await refreshTokenRepository.revokeAllForUser(existing.user_id);
  }
  return null;
}

// Simple logout: revoke this one device's session if it's still active. A no-op (not an error)
// if the token is already revoked, expired, or doesn't exist -- logout is idempotent.
async function revokeByRawToken(rawToken) {
  await refreshTokenRepository.revokeIfActiveByHash(hashToken(rawToken));
}

async function revokeAllForUser(userId) {
  return refreshTokenRepository.revokeAllForUser(userId);
}

// Used by auth.middleware.js on every authenticated request -- goes through this service rather
// than the repository directly, since middleware gets no exception to the layering rule
// (04-application-architecture.md §1).
async function isSessionActive(sessionId) {
  const session = await refreshTokenRepository.findById(sessionId);
  return Boolean(session && session.revoked_at === null);
}

export const refreshTokenService = {
  issue,
  rotate,
  revokeByRawToken,
  revokeAllForUser,
  isSessionActive,
};
