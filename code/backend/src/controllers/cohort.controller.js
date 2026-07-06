import { asyncHandler } from "../utils/asyncHandler.js";
import { cohortService } from "../services/cohort.service.js";

export const getCohortController = asyncHandler(async (req, res) => {
  const cohort = await cohortService.getById(Number(req.params.cohortId));
  res.status(200).json({ cohort });
});

// GET /cohorts?instructorId=me (02-api-contract.md §6.2) -- instructor-only, always the caller's
// own cohorts; no admin variant is documented for this route.
export const listCohortsController = asyncHandler(async (req, res) => {
  const cohorts = await cohortService.listForInstructor(req.user.id);
  res.status(200).json({
    cohorts,
    pagination: { page: 1, limit: cohorts.length, total: cohorts.length },
  });
});

export const createCohortController = asyncHandler(async (req, res) => {
  const cohort = await cohortService.create(req.validatedBody, req.user);
  res.status(201).json({ cohort });
});

export const updateCohortController = asyncHandler(async (req, res) => {
  const cohort = await cohortService.update(
    Number(req.params.cohortId),
    req.validatedBody,
    req.user
  );
  res.status(200).json({ cohort });
});

export const deleteCohortController = asyncHandler(async (req, res) => {
  await cohortService.remove(Number(req.params.cohortId), req.user.id);
  res.status(200).end();
});
