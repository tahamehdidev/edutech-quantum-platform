import { asyncHandler } from "../utils/asyncHandler.js";
import { practiceSetService } from "../services/practiceSet.service.js";

export const listPracticeSetsController = asyncHandler(async (req, res) => {
  const practiceSets = await practiceSetService.listForLesson(Number(req.params.lessonId));
  res.status(200).json({
    practiceSets,
    pagination: { page: 1, limit: practiceSets.length, total: practiceSets.length },
  });
});

export const getPracticeSetController = asyncHandler(async (req, res) => {
  const practiceSet = await practiceSetService.getById(
    Number(req.params.practiceSetId),
    req.user.role
  );
  res.status(200).json({ practiceSet });
});

export const createPracticeSetController = asyncHandler(async (req, res) => {
  const practiceSet = await practiceSetService.create(
    Number(req.params.lessonId),
    req.validatedBody
  );
  res.status(201).json({ practiceSet });
});

export const updatePracticeSetController = asyncHandler(async (req, res) => {
  const practiceSet = await practiceSetService.update(
    Number(req.params.practiceSetId),
    req.validatedBody
  );
  res.status(200).json({ practiceSet });
});

export const deletePracticeSetController = asyncHandler(async (req, res) => {
  await practiceSetService.remove(Number(req.params.practiceSetId));
  res.status(200).end();
});
