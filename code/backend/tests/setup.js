import "dotenv/config";
import pg from "pg";

if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "tests/setup.js must only be imported when NODE_ENV=test (see tests/preload.js)."
  );
}

// Admin connection, not the app's own pool: app_user deliberately lacks TRUNCATE (and
// UPDATE/DELETE on audit_log specifically, per migrations/015) so resetting test data between
// runs requires the elevated role migrate.js already uses -- never something the running app
// itself could do, by design.
const adminClient = new pg.Client({ connectionString: process.env.ADMIN_TEST_DATABASE_URL });
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await adminClient.connect();
    connected = true;
  }
}

// Wipes every data table (not schema_migrations, which tracks applied migrations, not test data)
// between tests. TRUNCATE ... CASCADE handles FK ordering automatically and RESTART IDENTITY
// keeps serial ids predictable across runs.
//
// IMPORTANT: every integration test file shares this same physical database, and Node's test
// runner runs test *files* concurrently by default -- if two files' beforeEach hooks fire this
// at the same time, one file's TRUNCATE wipes rows another file is mid-test relying on, causing
// deadlocks and FK-violation errors that have nothing to do with real bugs. package.json's "test"
// script passes --test-concurrency=1 specifically to serialize test files against this shared
// database; do not remove that flag without giving each test file its own database/schema first.
export async function resetDb() {
  await ensureConnected();
  await adminClient.query(`
    TRUNCATE TABLE
      audit_log, attempt, progress, cohort_enrollment, cohort,
      practice_set_question, screen_question, practice_set, screen, lesson, chapter, course,
      refresh_token, "user"
    RESTART IDENTITY CASCADE;
  `);
}

export async function closeTestDb() {
  if (connected) {
    await adminClient.end();
    connected = false;
  }
}
