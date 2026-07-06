import { asyncHandler } from "../utils/asyncHandler.js";
import { cohortEnrollmentService } from "../services/cohortEnrollment.service.js";

export const listStudentsController = asyncHandler(async (req, res) => {
  const students = await cohortEnrollmentService.listForCohort(Number(req.params.cohortId));
  res.status(200).json({
    students,
    pagination: { page: 1, limit: students.length, total: students.length },
  });
});

export const enrollStudentController = asyncHandler(async (req, res) => {
  const enrollment = await cohortEnrollmentService.enroll(
    Number(req.params.cohortId),
    req.validatedBody.userId
  );
  res.status(201).json({ enrollment });
});

// PATCH, not DELETE (02-api-contract.md §6.1) -- marks the enrollment removed, doesn't delete it.
export const removeStudentController = asyncHandler(async (req, res) => {
  const enrollment = await cohortEnrollmentService.remove(
    Number(req.params.cohortId),
    req.params.userId
  );
  res.status(200).json({ enrollment });
});
