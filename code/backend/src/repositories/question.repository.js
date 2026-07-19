import { pool } from "../config/db.js";

// 02-api-contract.md §4.3 -- search/browse the question bank by prompt substring and/or type,
// paginated. Never a bare array (§9's list-endpoint convention).
async function findAll({ search, type, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`prompt ILIKE $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rowsParams = [...params, limit, (page - 1) * limit];
  const result = await pool.query(
    `SELECT * FROM question ${whereClause} ORDER BY created_at LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    rowsParams
  );

  const countResult = await pool.query(`SELECT COUNT(*) FROM question ${whereClause}`, params);

  return { questions: result.rows, total: Number(countResult.rows[0].count) };
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM question WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

async function create({ prompt, type, content, createdById, hint, explanation }) {
  const result = await pool.query(
    `INSERT INTO question (prompt, type, content, created_by_id, hint, explanation)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [prompt, type, JSON.stringify(content), createdById, hint ?? null, explanation ?? null]
  );
  return result.rows[0];
}

async function update(id, { prompt, type, content, hint, explanation }) {
  const result = await pool.query(
    `UPDATE question
     SET prompt = COALESCE($1, prompt), type = COALESCE($2, type), content = COALESCE($3, content),
         hint = COALESCE($4, hint), explanation = COALESCE($5, explanation)
     WHERE id = $6 RETURNING *`,
    [
      prompt ?? null,
      type ?? null,
      content !== undefined ? JSON.stringify(content) : null,
      hint ?? null,
      explanation ?? null,
      id,
    ]
  );
  return result.rows[0] ?? null;
}

// Cascades to ScreenQuestion/PracticeSetQuestion rows with no pre-check for existing attachments
// -- a deliberately accepted risk (06-threat-model.md, Instructor actor, Tampering).
async function deleteById(id) {
  await pool.query("DELETE FROM question WHERE id = $1", [id]);
}

// The two junction-table paths requireQuestionEditAccess traverses (03-security-architecture.md
// §3.4 Variant D) -- kept as two independent functions/queries rather than one combined query,
// per 06-threat-model.md's own reasoning: a fix to one path could leave the other broken, so each
// needs to be independently testable.
async function isAttachedViaScreenToOwnedCourse(questionId, instructorId) {
  const result = await pool.query(
    `SELECT 1 FROM screen_question sq
     JOIN screen s ON s.id = sq.screen_id
     JOIN lesson l ON l.id = s.lesson_id
     JOIN chapter ch ON ch.id = l.chapter_id
     JOIN course c ON c.id = ch.course_id
     WHERE sq.question_id = $1 AND c.created_by_id = $2
     LIMIT 1`,
    [questionId, instructorId]
  );
  return result.rows.length > 0;
}

async function isAttachedViaPracticeSetToOwnedCourse(questionId, instructorId) {
  const result = await pool.query(
    `SELECT 1 FROM practice_set_question psq
     JOIN practice_set ps ON ps.id = psq.practice_set_id
     JOIN lesson l ON l.id = ps.lesson_id
     JOIN chapter ch ON ch.id = l.chapter_id
     JOIN course c ON c.id = ch.course_id
     WHERE psq.question_id = $1 AND c.created_by_id = $2
     LIMIT 1`,
    [questionId, instructorId]
  );
  return result.rows.length > 0;
}

export const questionRepository = {
  findAll,
  findById,
  create,
  update,
  deleteById,
  isAttachedViaScreenToOwnedCourse,
  isAttachedViaPracticeSetToOwnedCourse,
};
