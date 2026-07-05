// Runs migrations/*.sql against the database, in filename order, skipping any already recorded
// in schema_migrations. Connects via ADMIN_DATABASE_URL (or ADMIN_TEST_DATABASE_URL with --test)
// -- the elevated bootstrap role, never the restricted app_user the running server uses. See
// migrations/000_create_app_role.sql for why that separation matters.
//
// Usage:
//   node scripts/migrate.js         -> migrates the dev database (ADMIN_DATABASE_URL)
//   node scripts/migrate.js --test  -> migrates the test database (ADMIN_TEST_DATABASE_URL)
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

const isTest = process.argv.includes("--test");
const connectionString = isTest ? process.env.ADMIN_TEST_DATABASE_URL : process.env.ADMIN_DATABASE_URL;

if (!connectionString) {
  console.error(
    `Missing ${isTest ? "ADMIN_TEST_DATABASE_URL" : "ADMIN_DATABASE_URL"} — set it in .env (see .env.example).`
  );
  process.exit(1);
}

async function migrate() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (await client.query("SELECT filename FROM schema_migrations")).rows.map((r) => r.filename)
    );

    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

    let ranCount = 0;
    for (const filename of files) {
      if (applied.has(filename)) continue;

      const sql = await readFile(path.join(migrationsDir, filename), "utf-8");
      console.log(`Applying ${filename}...`);

      await client.query("BEGIN");
      try {
        // Simple query protocol (no params) supports multiple semicolon-separated statements
        // in one call -- required since a migration file is a whole DDL script, not one query.
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${filename} failed: ${err.message}`);
      }
      ranCount++;
    }

    console.log(
      ranCount === 0
        ? `Already up to date (${files.length} migrations, none pending).`
        : `Applied ${ranCount} migration(s). ${files.length} total.`
    );
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
