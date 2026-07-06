import { pool } from "../config/db.js";

// The composite PK on (screen_id, question_id) is the actual enforcement mechanism for
// "already attached" -- this catches that constraint violation and returns null so the service
// can translate it into a clean 409, rather than a raw DB error surfacing (02-api-contract.md §4.1).
async function attach(screenId, questionId) {
  try {
    const result = await pool.query(
      "INSERT INTO screen_question (screen_id, question_id) VALUES ($1, $2) RETURNING *",
      [screenId, questionId]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") return null; // unique_violation
    throw err;
  }
}

async function detach(screenId, questionId) {
  const result = await pool.query(
    "DELETE FROM screen_question WHERE screen_id = $1 AND question_id = $2 RETURNING *",
    [screenId, questionId]
  );
  return result.rows[0] ?? null;
}

async function findQuestionsForScreen(screenId) {
  const result = await pool.query(
    "SELECT q.* FROM screen_question sq JOIN question q ON q.id = sq.question_id WHERE sq.screen_id = $1",
    [screenId]
  );
  return result.rows;
}

// Backs POST /attempts step 3 (02-api-contract.md §5.3) -- prevents submitting an answer to a
// question never actually shown in the given screen.
async function isAttached(screenId, questionId) {
  const result = await pool.query(
    "SELECT 1 FROM screen_question WHERE screen_id = $1 AND question_id = $2 LIMIT 1",
    [screenId, questionId]
  );
  return result.rows.length > 0;
}

export const screenQuestionRepository = { attach, detach, findQuestionsForScreen, isAttached };
