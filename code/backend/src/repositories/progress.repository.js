import { pool } from "../config/db.js";

async function findByUserAndCourse(userId, courseId) {
  const result = await pool.query("SELECT * FROM progress WHERE user_id = $1 AND course_id = $2", [
    userId,
    courseId,
  ]);
  return result.rows[0] ?? null;
}

async function findAllForUser(userId) {
  const result = await pool.query("SELECT * FROM progress WHERE user_id = $1", [userId]);
  return result.rows;
}

// Backs requireStudentOwnership's threat-model-gap-#3 amendment (02-api-contract.md §5.2): a
// teaching relationship alone isn't enough to grant access to a student's data -- the student
// must also have Progress in the specifically-requested course, or an instructor connected via
// one course could see attempts/progress in unrelated courses too.
async function existsForUserAndCourse(userId, courseId) {
  const progress = await findByUserAndCourse(userId, courseId);
  return progress !== null;
}

// Upsert -- a user's first correct attempt in a course creates the Progress row, later correct
// attempts increment it. No write endpoint reaches this (02-api-contract.md §5.1); only
// attempt.service.js's submitAttempt() ever calls it.
async function awardXp(userId, courseId, xpAmount) {
  const result = await pool.query(
    `INSERT INTO progress (user_id, course_id, xp)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, course_id) DO UPDATE SET xp = progress.xp + $3
     RETURNING *`,
    [userId, courseId, xpAmount]
  );
  return result.rows[0];
}

export const progressRepository = {
  findByUserAndCourse,
  findAllForUser,
  existsForUserAndCourse,
  awardXp,
};
