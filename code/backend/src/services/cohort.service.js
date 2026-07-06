import { cohortRepository } from "../repositories/cohort.repository.js";
import { cohortEnrollmentRepository } from "../repositories/cohortEnrollment.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { auditLogService } from "./auditLog.service.js";
import { NotFoundError, ForbiddenError, InvalidRoleForActionError } from "../errors/index.js";

async function getById(id) {
  const cohort = await cohortRepository.findById(id);
  if (!cohort) throw new NotFoundError("Cohort not found.");
  return cohort;
}

async function listForInstructor(instructorId) {
  return cohortRepository.findAllForInstructor(instructorId);
}

// Resolves who a new Cohort's instructor_id is, per the server-side branching rule
// (02-api-contract.md §6.3): an instructor's own instructorId in the body is ignored (mass-
// assignment principle, same as signup's role field); an admin may set it explicitly, but it
// must reference a real instructor.
async function resolveInstructorId(instructorId, caller) {
  if (caller.role !== "admin" || !instructorId) return caller.id;

  const target = await userRepository.findById(instructorId);
  if (!target || target.role !== "instructor") {
    throw new InvalidRoleForActionError(
      "instructorId must reference an existing instructor.",
      "instructorId"
    );
  }
  return instructorId;
}

async function create({ name, instructorId }, caller) {
  const resolvedInstructorId = await resolveInstructorId(instructorId, caller);
  return cohortRepository.create({ name, instructorId: resolvedInstructorId });
}

// Reassignment (instructorId actually changing) is the one branch that gets audited
// (03-security-architecture.md §8.4's cohort.instructor_reassigned) -- a plain name-only update
// isn't a reassignment and doesn't log anything.
async function update(id, { name, instructorId }, caller) {
  const cohort = await getById(id);
  const resolvedInstructorId =
    instructorId !== undefined ? await resolveInstructorId(instructorId, caller) : undefined;
  const isReassignment =
    resolvedInstructorId !== undefined && resolvedInstructorId !== cohort.instructor_id;

  const updated = await cohortRepository.update(id, {
    name,
    instructorId: isReassignment ? resolvedInstructorId : undefined,
  });

  if (isReassignment) {
    await auditLogService.record({
      userId: caller.id,
      action: "cohort.instructor_reassigned",
      resourceType: "Cohort",
      resourceId: String(id),
      metadata: { fromInstructorId: cohort.instructor_id, toInstructorId: resolvedInstructorId },
    });
  }

  return updated;
}

// Enrollment history has no ON DELETE CASCADE from Cohort (01-data-model.md) -- deleting the
// Cohort is explicitly orchestrated here rather than left to a DB-level cascade, since it's the
// one case where enrollment history doesn't outlive its Cohort.
async function remove(id, deletedByUserId) {
  await getById(id); // 404 before anything else
  const removedEnrollments = await cohortEnrollmentRepository.deleteAllForCohort(id);
  await cohortRepository.deleteById(id);
  await auditLogService.record({
    userId: deletedByUserId,
    action: "cohort.deleted",
    resourceType: "Cohort",
    resourceId: String(id),
    metadata: { removedEnrollments },
  });
}

async function checkOwnership(userId, cohortId) {
  const cohort = await getById(cohortId);
  if (cohort.instructor_id !== userId) throw new ForbiddenError("You do not own this cohort.");
  return cohort;
}

export const cohortService = { getById, listForInstructor, create, update, remove, checkOwnership };
