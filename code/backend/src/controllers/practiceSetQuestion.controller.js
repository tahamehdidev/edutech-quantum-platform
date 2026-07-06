import { asyncHandler } from "../utils/asyncHandler.js";
import { practiceSetQuestionService } from "../services/practiceSetQuestion.service.js";

export const attachQuestionToPracticeSetController = asyncHandler(async (req, res) => {
  await practiceSetQuestionService.attach(
    Number(req.params.practiceSetId),
    req.validatedBody.questionId
  );
  res.status(201).end();
});

export const detachQuestionFromPracticeSetController = asyncHandler(async (req, res) => {
  await practiceSetQuestionService.detach(
    Number(req.params.practiceSetId),
    Number(req.params.questionId)
  );
  res.status(200).end();
});

export const reorderPracticeSetQuestionsController = asyncHandler(async (req, res) => {
  await practiceSetQuestionService.reorder(
    Number(req.params.practiceSetId),
    req.validatedBody.orderedIds
  );
  res.status(200).end();
});
