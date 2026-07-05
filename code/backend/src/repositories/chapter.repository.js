import { pool } from "../config/db.js";
import { withOrderedInsert } from "../utils/orderedInsert.js";

async function findAllForCourse(courseId) {
  const result = await pool.query(
    "SELECT * FROM chapter WHERE course_id = $1 ORDER BY order_index",
    [courseId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM chapter WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

// order_index is server-computed (MAX+1), never client-supplied (02-api-contract.md §3.1).
async function create({ courseId, title }) {
  return withOrderedInsert(
    { lockTable: "course", parentId: courseId, childTable: "chapter", parentColumn: "course_id" },
    async (client, orderIndex) => {
      const result = await client.query(
        "INSERT INTO chapter (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING *",
        [courseId, title, orderIndex]
      );
      return result.rows[0];
    }
  );
}

async function update(id, { title }) {
  const result = await pool.query("UPDATE chapter SET title = $1 WHERE id = $2 RETURNING *", [
    title,
    id,
  ]);
  return result.rows[0] ?? null;
}

// Returns the actual current sibling ids for the exact-set-match reorder check
// (02-api-contract.md §3.4), and applies the new order in the same transaction the caller wraps
// this in -- see chapter.service.js's reorder().
async function findSiblingIds(courseId) {
  const result = await pool.query("SELECT id FROM chapter WHERE course_id = $1", [courseId]);
  return result.rows.map((r) => r.id);
}

async function applyOrder(orderedIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query("UPDATE chapter SET order_index = $1 WHERE id = $2", [
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

async function getCascadeCounts(id) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM lesson WHERE chapter_id = $1) AS lesson_count,
       (SELECT COUNT(*) FROM screen WHERE lesson_id IN (SELECT id FROM lesson WHERE chapter_id = $1)) AS screen_count`,
    [id]
  );
  return result.rows[0];
}

async function deleteById(id) {
  await pool.query("DELETE FROM chapter WHERE id = $1", [id]);
}

export const chapterRepository = {
  findAllForCourse,
  findById,
  create,
  update,
  findSiblingIds,
  applyOrder,
  getCascadeCounts,
  deleteById,
};
