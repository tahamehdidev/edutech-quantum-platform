import { pool } from "../config/db.js";

// Minimal function built ahead of Milestone 5's full Cohort/CohortEnrollment CRUD -- Milestone 4's
// requireStudentOwnership (Variant B) needs this now (same precedent as auditLogRepository.create()
// being built minimally ahead of Milestone 6's full AuditLog CRUD). Deliberately no
// `WHERE status = 'active'` clause (03-security-architecture.md §3.4 Variant B) -- historical
// (removed) enrollments still count, so an instructor keeps access to a student's historical
// attempt/progress data after that student leaves their cohort.
async function existsForInstructor(instructorId, targetUserId) {
  const result = await pool.query(
    `SELECT 1 FROM cohort_enrollment ce
     JOIN cohort c ON c.id = ce.cohort_id
     WHERE c.instructor_id = $1 AND ce.user_id = $2
     LIMIT 1`,
    [instructorId, targetUserId]
  );
  return result.rows.length > 0;
}

export const cohortEnrollmentRepository = { existsForInstructor };
