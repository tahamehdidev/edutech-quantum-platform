import { pool } from "../config/db.js";

async function findById(id) {
  const result = await pool.query("SELECT * FROM cohort WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

async function findAllForInstructor(instructorId) {
  const result = await pool.query(
    "SELECT * FROM cohort WHERE instructor_id = $1 ORDER BY created_at",
    [instructorId]
  );
  return result.rows;
}

async function create({ name, instructorId }) {
  const result = await pool.query(
    "INSERT INTO cohort (name, instructor_id) VALUES ($1, $2) RETURNING *",
    [name, instructorId]
  );
  return result.rows[0];
}

async function update(id, { name, instructorId }) {
  const result = await pool.query(
    "UPDATE cohort SET name = COALESCE($1, name), instructor_id = COALESCE($2, instructor_id) WHERE id = $3 RETURNING *",
    [name ?? null, instructorId ?? null, id]
  );
  return result.rows[0] ?? null;
}

async function deleteById(id) {
  await pool.query("DELETE FROM cohort WHERE id = $1", [id]);
}

export const cohortRepository = { findById, findAllForInstructor, create, update, deleteById };
