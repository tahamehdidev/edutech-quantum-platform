import pg from "pg";
import { env } from "./env.js";

// Render's managed Postgres presents a certificate not in Node's default trust store; local
// Docker Compose Postgres has no TLS at all. Gating on NODE_ENV keeps dev/test/CI untouched
// while making the production connection actually work (unset, `new pg.Pool` defaults to no
// SSL, which Render's Postgres rejects outright).
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Backs GET /health (02-api-contract.md §0.4) -- 200 if reachable, 503 if not.
export async function checkDbConnection() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
