import { cohortEnrollmentRepository } from "../repositories/cohortEnrollment.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";

// Minimal service built ahead of Milestone 5's full Cohort/CohortEnrollment CRUD -- backs
// requireStudentOwnership (ownership.middleware.js), the only thing that needs this in Milestone 4.
//
// 02-api-contract.md §5.2 "Why courseId became required" (threat-model gap #3): a teaching
// relationship alone used to be sufficient, letting an instructor connected via one course see a
// student's data in every course they take. Access now requires BOTH an independent fact --
// (a) a teaching relationship via CohortEnrollment, and (b) the student having a Progress row for
// the specifically-requested courseId -- rather than one query that conflates them, since no
// schema link exists directly from Cohort to Course.
async function checkStudentOwnership(instructorId, targetUserId, courseId) {
  const hasRelationship = await cohortEnrollmentRepository.existsForInstructor(
    instructorId,
    targetUserId
  );
  if (!hasRelationship) return false;
  return progressRepository.existsForUserAndCourse(targetUserId, courseId);
}

export const cohortEnrollmentService = { checkStudentOwnership };
