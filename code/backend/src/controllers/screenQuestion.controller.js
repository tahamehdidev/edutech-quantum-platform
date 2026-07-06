import { asyncHandler } from "../utils/asyncHandler.js";
import { screenQuestionService } from "../services/screenQuestion.service.js";

export const attachQuestionToScreenController = asyncHandler(async (req, res) => {
  await screenQuestionService.attach(Number(req.params.screenId), req.validatedBody.questionId);
  res.status(201).end();
});

export const detachQuestionFromScreenController = asyncHandler(async (req, res) => {
  await screenQuestionService.detach(Number(req.params.screenId), Number(req.params.questionId));
  res.status(200).end();
});
