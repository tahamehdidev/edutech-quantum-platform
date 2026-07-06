import { pool } from "../config/db.js";

async function create({ userId, questionId, contextType, contextId, answer, isCorrect }) {
  const result = await pool.query(
    `INSERT INTO attempt (user_id, question_id, context_type, context_id, answer, is_correct)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, questionId, contextType, contextId, JSON.stringify(answer), isCorrect]
  );
  return result.rows[0];
}

// Backs the EXISTS-before-insert check that must run before every insert (02-api-contract.md
// §5.3 step 5) -- backed by idx_attempt_user_question_correct.
async function hasCorrectAttempt(userId, questionId) {
  const result = await pool.query(
    "SELECT 1 FROM attempt WHERE user_id = $1 AND question_id = $2 AND is_correct = true LIMIT 1",
    [userId, questionId]
  );
  return result.rows.length > 0;
}

async function findAllForUser(userId) {
  const result = await pool.query(
    "SELECT * FROM attempt WHERE user_id = $1 ORDER BY attempted_at DESC",
    [userId]
  );
  return result.rows;
}

// Attempt.context_id is polymorphic with no course_id column (01-data-model.md), so "this user's
// attempts within this course" means resolving both possible context tables up to Course and
// unioning -- same up-the-chain shape as course.repository.js's hierarchy resolvers, just inlined
// as a filter on both sides of the polymorphic split rather than a single id lookup.
async function findAllForUserAndCourse(userId, courseId) {
  const result = await pool.query(
    `SELECT a.* FROM attempt a
     WHERE a.user_id = $1
       AND (
         (a.context_type = 'screen' AND a.context_id IN (
           SELECT s.id FROM screen s
           JOIN lesson l ON l.id = s.lesson_id
           JOIN chapter ch ON ch.id = l.chapter_id
           WHERE ch.course_id = $2
         ))
         OR
         (a.context_type = 'practice_set' AND a.context_id IN (
           SELECT ps.id FROM practice_set ps
           JOIN lesson l ON l.id = ps.lesson_id
           JOIN chapter ch ON ch.id = l.chapter_id
           WHERE ch.course_id = $2
         ))
       )
     ORDER BY a.attempted_at DESC`,
    [userId, courseId]
  );
  return result.rows;
}

export const attemptRepository = {
  create,
  hasCorrectAttempt,
  findAllForUser,
  findAllForUserAndCourse,
};
