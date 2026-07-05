import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

// Backs GET /health (02-api-contract.md §0.4) -- 200 if reachable, 503 if not.
export async function checkDbConnection() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
