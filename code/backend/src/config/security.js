import argon2 from "argon2";

// Hardcoded deliberately (03-security-architecture.md §1.2), not environment-configurable.
// Security-critical config that's too flexible creates its own risk -- an .env value set low
// "for local dev speed" can silently ship to production if an environment variable is copied
// carelessly between environments. Changing these later requires a deliberate code change and
// review, not a one-line environment edit. argon2.verify() continues to work against old hashes
// even if these change later, since the parameters used are embedded in the stored hash string.
export const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB -- OWASP minimum recommendation
  timeCost: 2,
  parallelism: 1,
};

// Also hardcoded, same reasoning (03-security-architecture.md §2.1).
export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_DAYS = 7;

// §0.2 of the API contract -- grace window past expiry before the cleanup job deletes a row.
export const REFRESH_TOKEN_CLEANUP_GRACE_DAYS = 30;
