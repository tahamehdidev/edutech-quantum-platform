import { pool } from "../config/db.js";
import { withOrderedInsert } from "../utils/orderedInsert.js";

// order_index is server-computed (same race-free pattern as chapter/lesson/screen creation,
// 02-api-contract.md §3.1) and the composite PK on (practice_set_id, question_id) is the
// enforcement mechanism for "already attached" -- caught here and translated to null so the
// service can return a clean 409 (§4.1).
async function attach(practiceSetId, questionId) {
  try {
    return await withOrderedInsert(
      {
        lockTable: "practice_set",
        parentId: practiceSetId,
        childTable: "practice_set_question",
        parentColumn: "practice_set_id",
      },
      async (client, orderIndex) => {
        const result = await client.query(
          "INSERT INTO practice_set_question (practice_set_id, question_id, order_index) VALUES ($1, $2, $3) RETURNING *",
          [practiceSetId, questionId, orderIndex]
        );
        return result.rows[0];
      }
    );
  } catch (err) {
    if (err.code === "23505") return null; // unique_violation
    throw err;
  }
}

async function detach(practiceSetId, questionId) {
  const result = await pool.query(
    "DELETE FROM practice_set_question WHERE practice_set_id = $1 AND question_id = $2 RETURNING *",
    [practiceSetId, questionId]
  );
  return result.rows[0] ?? null;
}

async function findQuestionsForPracticeSet(practiceSetId) {
  const result = await pool.query(
    `SELECT q.* FROM practice_set_question psq
     JOIN question q ON q.id = psq.question_id
     WHERE psq.practice_set_id = $1
     ORDER BY psq.order_index`,
    [practiceSetId]
  );
  return result.rows;
}

async function findSiblingQuestionIds(practiceSetId) {
  const result = await pool.query(
    "SELECT question_id FROM practice_set_question WHERE practice_set_id = $1",
    [practiceSetId]
  );
  return result.rows.map((r) => r.question_id);
}

async function applyOrder(practiceSetId, orderedQuestionIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedQuestionIds.length; i++) {
      await client.query(
        "UPDATE practice_set_question SET order_index = $1 WHERE practice_set_id = $2 AND question_id = $3",
        [i + 1, practiceSetId, orderedQuestionIds[i]]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Backs POST /attempts step 3 (02-api-contract.md §5.3) -- prevents submitting an answer to a
// question never actually attached to the given practice set.
async function isAttached(practiceSetId, questionId) {
  const result = await pool.query(
    "SELECT 1 FROM practice_set_question WHERE practice_set_id = $1 AND question_id = $2 LIMIT 1",
    [practiceSetId, questionId]
  );
  return result.rows.length > 0;
}

export const practiceSetQuestionRepository = {
  attach,
  detach,
  findQuestionsForPracticeSet,
  findSiblingQuestionIds,
  applyOrder,
  isAttached,
};
