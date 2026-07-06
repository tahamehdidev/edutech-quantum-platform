import { pool } from "../config/db.js";

// Controller+service only, no repository (per the project plan) -- these are bespoke aggregate
// reporting queries that don't map onto any single resource's CRUD repository, so the service
// issues SQL directly rather than inventing a repository file with one function each used by
// exactly one caller.

const LESSON_PACING_NOTE =
  "Approximate -- measures time between consecutive question attempts only. Does not capture " +
  "time on screens without questions, or time before the first question in a lesson.";

// GET /cohorts/:id/dashboard/completion (02-api-contract.md §7.3). A Cohort has no course_id
// (01-data-model.md) -- it can work through multiple courses over time -- so this returns one
// entry per course any of the cohort's active students has a Progress row in, not a single
// object.
//
// CAUTION -- "completed" always reads 0 today: no code anywhere in this codebase ever sets
// Progress.completed_at (course-completion detection is unspecified, out of scope for every
// milestone built so far). The query below is real, correct SQL that will start returning
// nonzero values the moment a future milestone adds that logic -- but until then, do not build
// anything (e.g. a frontend "% complete" widget) that assumes this number is currently meaningful.
async function getCompletionStats(cohortId) {
  const result = await pool.query(
    `WITH roster AS (
       SELECT COUNT(*) AS total_students FROM cohort_enrollment
       WHERE cohort_id = $1 AND status = 'active'
     )
     SELECT
       c.id AS course_id,
       c.title AS course_title,
       roster.total_students,
       -- Always 0 today -- see the CAUTION above getCompletionStats().
       COUNT(*) FILTER (WHERE p.completed_at IS NOT NULL) AS completed,
       COUNT(*) FILTER (WHERE p.completed_at IS NULL) AS in_progress,
       ROUND(AVG(p.xp)) AS average_xp
     FROM progress p
     JOIN cohort_enrollment ce
       ON ce.user_id = p.user_id AND ce.cohort_id = $1 AND ce.status = 'active'
     JOIN course c ON c.id = p.course_id
     CROSS JOIN roster
     GROUP BY c.id, c.title, roster.total_students
     ORDER BY c.id`,
    [cohortId]
  );

  return result.rows.map((row) => ({
    courseId: row.course_id,
    courseTitle: row.course_title,
    totalStudents: Number(row.total_students),
    completed: Number(row.completed), // always 0 today -- see the CAUTION above getCompletionStats()
    inProgress: Number(row.in_progress),
    notStarted: Number(row.total_students) - Number(row.completed) - Number(row.in_progress),
    averageXp: row.average_xp !== null ? Number(row.average_xp) : 0,
  }));
}

// GET /cohorts/:id/dashboard/lesson-pacing (02-api-contract.md §7.4). Approximates time-on-lesson
// from gaps between a user's consecutive Attempt.attempted_at timestamps within the same lesson --
// the closest available proxy given no explicit "lesson started" event exists. Resolves each
// Attempt's lesson_id from its polymorphic context (Screen/PracticeSet both have lesson_id
// directly, one level up, unlike Course resolution which needs the full chapter join).
async function getLessonPacing(cohortId) {
  const result = await pool.query(
    `WITH cohort_attempts AS (
       SELECT a.user_id, a.attempted_at,
         CASE a.context_type
           WHEN 'screen' THEN (SELECT lesson_id FROM screen WHERE id = a.context_id)
           WHEN 'practice_set' THEN (SELECT lesson_id FROM practice_set WHERE id = a.context_id)
         END AS lesson_id
       FROM attempt a
       JOIN cohort_enrollment ce
         ON ce.user_id = a.user_id AND ce.cohort_id = $1 AND ce.status = 'active'
     ),
     gaps AS (
       SELECT lesson_id,
         EXTRACT(EPOCH FROM (
           attempted_at - LAG(attempted_at) OVER (PARTITION BY user_id, lesson_id ORDER BY attempted_at)
         )) AS gap_seconds
       FROM cohort_attempts
       WHERE lesson_id IS NOT NULL
     )
     SELECT l.id AS lesson_id, l.title AS lesson_title,
       ROUND(AVG(g.gap_seconds)) AS average_inter_question_seconds,
       COUNT(g.gap_seconds) AS sample_size
     FROM gaps g
     JOIN lesson l ON l.id = g.lesson_id
     WHERE g.gap_seconds IS NOT NULL
     GROUP BY l.id, l.title
     ORDER BY l.id`,
    [cohortId]
  );

  return result.rows.map((row) => ({
    lessonId: row.lesson_id,
    lessonTitle: row.lesson_title,
    averageInterQuestionSeconds: Number(row.average_inter_question_seconds),
    sampleSize: Number(row.sample_size),
    note: LESSON_PACING_NOTE,
  }));
}

export const dashboardService = { getCompletionStats, getLessonPacing };
