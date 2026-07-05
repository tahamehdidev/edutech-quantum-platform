import { pool } from "../config/db.js";
import { withOrderedInsert } from "../utils/orderedInsert.js";

async function findAllForLesson(lessonId) {
  const result = await pool.query(
    "SELECT * FROM screen WHERE lesson_id = $1 ORDER BY order_index",
    [lessonId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM screen WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

async function create({ lessonId, type, content }) {
  return withOrderedInsert(
    { lockTable: "lesson", parentId: lessonId, childTable: "screen", parentColumn: "lesson_id" },
    async (client, orderIndex) => {
      const result = await client.query(
        "INSERT INTO screen (lesson_id, type, content, order_index) VALUES ($1, $2, $3, $4) RETURNING *",
        [lessonId, type, JSON.stringify(content ?? null), orderIndex]
      );
      return result.rows[0];
    }
  );
}

async function update(id, { type, content }) {
  const result = await pool.query(
    "UPDATE screen SET type = COALESCE($1, type), content = COALESCE($2, content) WHERE id = $3 RETURNING *",
    [type ?? null, content !== undefined ? JSON.stringify(content) : null, id]
  );
  return result.rows[0] ?? null;
}

async function findSiblingIds(lessonId) {
  const result = await pool.query("SELECT id FROM screen WHERE lesson_id = $1", [lessonId]);
  return result.rows.map((r) => r.id);
}

async function applyOrder(orderedIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query("UPDATE screen SET order_index = $1 WHERE id = $2", [
        i + 1,
        orderedIds[i],
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Leaf node -- no cascade counts needed, delete has no ?confirm=true requirement
// (02-api-contract.md §3.5).
async function deleteById(id) {
  await pool.query("DELETE FROM screen WHERE id = $1", [id]);
}

export const screenRepository = {
  findAllForLesson,
  findById,
  create,
  update,
  findSiblingIds,
  applyOrder,
  deleteById,
};
