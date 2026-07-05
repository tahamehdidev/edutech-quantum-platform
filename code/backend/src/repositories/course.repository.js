import { pool } from "../config/db.js";

async function findAll() {
  const result = await pool.query("SELECT * FROM course ORDER BY created_at");
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM course WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

async function create({ title, narrative, createdById }) {
  const result = await pool.query(
    "INSERT INTO course (title, narrative, created_by_id) VALUES ($1, $2, $3) RETURNING *",
    [title, narrative ?? null, createdById]
  );
  return result.rows[0];
}

async function update(id, { title, narrative }) {
  const result = await pool.query(
    "UPDATE course SET title = COALESCE($1, title), narrative = COALESCE($2, narrative) WHERE id = $3 RETURNING *",
    [title ?? null, narrative ?? null, id]
  );
  return result.rows[0] ?? null;
}

// No ON DELETE trigger needed for cascade counts -- the caller (course.service.js) fetches these
// before deleting, for the AuditLog metadata (04-application-architecture.md §1.1 example).
async function getCascadeCounts(id) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM chapter WHERE course_id = $1) AS chapter_count,
       (SELECT COUNT(*) FROM lesson WHERE chapter_id IN (SELECT id FROM chapter WHERE course_id = $1)) AS lesson_count,
       (SELECT COUNT(*) FROM screen WHERE lesson_id IN (
          SELECT id FROM lesson WHERE chapter_id IN (SELECT id FROM chapter WHERE course_id = $1)
       )) AS screen_count`,
    [id]
  );
  return result.rows[0];
}

async function deleteById(id) {
  await pool.query("DELETE FROM course WHERE id = $1", [id]);
}

// Upward hierarchy resolvers (03-security-architecture.md §3.4 Variant C) -- one join-up-the-chain
// query per level, used by ownership.middleware.js's requireCourseOwnership to find the owning
// Course from whichever depth a route operates at.
async function resolveFromChapterId(chapterId) {
  const result = await pool.query("SELECT course_id FROM chapter WHERE id = $1", [chapterId]);
  return result.rows[0]?.course_id ?? null;
}

async function resolveFromLessonId(lessonId) {
  const result = await pool.query(
    `SELECT c.id FROM course c
     JOIN chapter ch ON ch.course_id = c.id
     JOIN lesson l ON l.chapter_id = ch.id
     WHERE l.id = $1`,
    [lessonId]
  );
  return result.rows[0]?.id ?? null;
}

async function resolveFromScreenId(screenId) {
  const result = await pool.query(
    `SELECT c.id FROM course c
     JOIN chapter ch ON ch.course_id = c.id
     JOIN lesson l ON l.chapter_id = ch.id
     JOIN screen s ON s.lesson_id = l.id
     WHERE s.id = $1`,
    [screenId]
  );
  return result.rows[0]?.id ?? null;
}

export const courseRepository = {
  findAll,
  findById,
  create,
  update,
  getCascadeCounts,
  deleteById,
  resolveFromChapterId,
  resolveFromLessonId,
  resolveFromScreenId,
};
