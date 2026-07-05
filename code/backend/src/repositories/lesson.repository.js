import { pool } from "../config/db.js";
import { withOrderedInsert } from "../utils/orderedInsert.js";

async function findAllForChapter(chapterId) {
  const result = await pool.query(
    "SELECT * FROM lesson WHERE chapter_id = $1 ORDER BY order_index",
    [chapterId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM lesson WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

async function create({ chapterId, title }) {
  return withOrderedInsert(
    { lockTable: "chapter", parentId: chapterId, childTable: "lesson", parentColumn: "chapter_id" },
    async (client, orderIndex) => {
      const result = await client.query(
        "INSERT INTO lesson (chapter_id, title, order_index) VALUES ($1, $2, $3) RETURNING *",
        [chapterId, title, orderIndex]
      );
      return result.rows[0];
    }
  );
}

async function update(id, { title }) {
  const result = await pool.query("UPDATE lesson SET title = $1 WHERE id = $2 RETURNING *", [
    title,
    id,
  ]);
  return result.rows[0] ?? null;
}

async function findSiblingIds(chapterId) {
  const result = await pool.query("SELECT id FROM lesson WHERE chapter_id = $1", [chapterId]);
  return result.rows.map((r) => r.id);
}

async function applyOrder(orderedIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query("UPDATE lesson SET order_index = $1 WHERE id = $2", [
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
    "SELECT COUNT(*) AS screen_count FROM screen WHERE lesson_id = $1",
    [id]
  );
  return result.rows[0];
}

async function deleteById(id) {
  await pool.query("DELETE FROM lesson WHERE id = $1", [id]);
}

export const lessonRepository = {
  findAllForChapter,
  findById,
  create,
  update,
  findSiblingIds,
  applyOrder,
  getCascadeCounts,
  deleteById,
};
