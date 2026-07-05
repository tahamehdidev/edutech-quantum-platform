import { pool } from "../config/db.js";

async function create({ userId, tokenHash, expiresAt }) {
  const result = await pool.query(
    "INSERT INTO refresh_token (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *",
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM refresh_token WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

// Any row matching the hash, regardless of revoked/expired state -- used only to distinguish
// "token never existed" from "token was already rotated out" (03-security-architecture.md §2.6's
// reuse-detection), never to authorize anything by itself.
async function findByHash(tokenHash) {
  const result = await pool.query("SELECT * FROM refresh_token WHERE token_hash = $1", [tokenHash]);
  return result.rows[0] ?? null;
}

// Atomic conditional update, not a separate check-then-act -- Postgres serializes concurrent
// writes to the same row, so only one of two simultaneous rotation attempts on the same token can
// match WHERE revoked_at IS NULL (03-security-architecture.md §2.6).
async function revokeIfActiveByHash(tokenHash) {
  const result = await pool.query(
    "UPDATE refresh_token SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL RETURNING *",
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

async function revokeAllForUser(userId) {
  await pool.query(
    "UPDATE refresh_token SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId]
  );
}

export const refreshTokenRepository = {
  create,
  findById,
  findByHash,
  revokeIfActiveByHash,
  revokeAllForUser,
};
