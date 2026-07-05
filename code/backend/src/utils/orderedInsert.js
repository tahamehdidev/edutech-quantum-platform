import { pool } from "../config/db.js";

// Shared by chapter/lesson/screen creation (and practice-set-question attachment in Milestone
// 3), which all need the same race-free "server computes order_index as MAX+1" pattern
// (02-api-contract.md §3.1) without either a duplicate-order_index race under concurrent creates
// or an extra client round-trip to fetch the current max first.
//
// This is an ordinary single-instance concurrency concern (two simultaneous HTTP requests to one
// Node process), not a scale problem this deployment doesn't have -- unlike, say, needing Redis
// for cross-instance rate-limit coordination (03-security-architecture.md §4.1), two concurrent
// "add a chapter" requests can happen at this project's actual scale, and the failure mode is
// silent, wrong data (two sibling rows both claiming the same order_index), not a loud error.
// Verified empirically with a genuine concurrency test (tests/integration/courses.test.js) --
// firing 3 truly concurrent creates and asserting distinct order_index values -- not just
// reasoned about, since a plausible-looking "combine the lock and the max computation into one
// query" simplification was tried here and tested wrong: FOR UPDATE's re-fetch-after-lock-wait
// guarantee applies to the locked row's own columns, not to a correlated subquery elsewhere in
// the same SELECT's target list, so two concurrent requests could both evaluate that subquery
// against a stale snapshot despite acquiring the row lock in the correct order. Keeping the lock
// and the max computation as two separate statements, in that order, is what actually works.
//
// Locks the parent row (lockTable/parentId) as a mutex for the duration of the transaction, so
// two concurrent creates under the *same* parent serialize instead of both computing the same
// "next" order_index. Locking the parent row works even when the child table has zero existing
// rows yet, unlike locking the (possibly empty) child rows directly.
//
// lockTable/childTable/parentColumn are always hardcoded literals passed by our own repository
// code (e.g. "course", "chapter", "course_id") -- never derived from request input -- so
// interpolating them into the query text here is not a SQL-injection risk.
export async function withOrderedInsert(
  { lockTable, parentId, childTable, parentColumn },
  insertFn
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SELECT id FROM ${lockTable} WHERE id = $1 FOR UPDATE`, [parentId]);
    const { rows } = await client.query(
      `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_index FROM ${childTable} WHERE ${parentColumn} = $1`,
      [parentId]
    );
    const row = await insertFn(client, rows[0].next_index);
    await client.query("COMMIT");
    return row;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
