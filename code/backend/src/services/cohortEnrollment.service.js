import { cohortEnrollmentRepository } from "../repositories/cohortEnrollment.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import {
  InvalidRoleForActionError,
  DuplicateResourceError,
  NotFoundError,
} from "../errors/index.js";

// checkStudentOwnership was built in Milestone 4, ahead of the rest of this file, since
// requireStudentOwnership (ownership.middleware.js) needed it then.
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

// 02-api-contract.md §6.4's validation order, steps 2-4 (step 1, cohort ownership, is
// requireCohortOwnership before this ever runs). "Doesn't exist" and "isn't a learner" are one
// combined check -- INVALID_ROLE_FOR_ACTION either way, same treatment as cohort.service.js's own
// instructorId check, since a nonexistent user trivially isn't a learner either.
async function enroll(cohortId, userId) {
  const user = await userRepository.findById(userId);
  if (!user || user.role !== "learner") {
    throw new InvalidRoleForActionError(
      "userId must reference an existing learner account.",
      "userId"
    );
  }

  const enrollment = await cohortEnrollmentRepository.create(cohortId, userId);
  if (!enrollment) {
    throw new DuplicateResourceError(
      "This student already has an active enrollment in this cohort."
    );
  }
  return enrollment;
}

async function listForCohort(cohortId) {
  return cohortEnrollmentRepository.findAllForCohort(cohortId);
}

async function remove(cohortId, userId) {
  const enrollment = await cohortEnrollmentRepository.markRemoved(cohortId, userId);
  if (!enrollment) {
    throw new NotFoundError("No active enrollment found for this student in this cohort.");
  }
  return enrollment;
}

export const cohortEnrollmentService = { checkStudentOwnership, enroll, listForCohort, remove };
