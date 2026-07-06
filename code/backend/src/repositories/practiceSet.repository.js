import { pool } from "../config/db.js";

// No order_index of its own (01-data-model.md) -- only PracticeSetQuestion is ordered.
async function findAllForLesson(lessonId) {
  const result = await pool.query("SELECT * FROM practice_set WHERE lesson_id = $1", [lessonId]);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM practice_set WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

async function create({ lessonId, title }) {
  const result = await pool.query(
    "INSERT INTO practice_set (lesson_id, title) VALUES ($1, $2) RETURNING *",
    [lessonId, title]
  );
  return result.rows[0];
}

async function update(id, { title }) {
  const result = await pool.query("UPDATE practice_set SET title = $1 WHERE id = $2 RETURNING *", [
    title,
    id,
  ]);
  return result.rows[0] ?? null;
}

async function deleteById(id) {
  await pool.query("DELETE FROM practice_set WHERE id = $1", [id]);
}

export const practiceSetRepository = { findAllForLesson, findById, create, update, deleteById };
