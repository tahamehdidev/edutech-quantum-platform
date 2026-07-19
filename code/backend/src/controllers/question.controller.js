import { asyncHandler } from "../utils/asyncHandler.js";
import { questionService } from "../services/question.service.js";
import { validateQuestionContent } from "../validators/question.validator.js";

export const listQuestionsController = asyncHandler(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await questionService.list(
    { search: req.query.search, type: req.query.type, page, limit },
    req.user.role
  );
  res.status(200).json(result);
});

export const getQuestionController = asyncHandler(async (req, res) => {
  const question = await questionService.getById(Number(req.params.questionId), req.user.role);
  res.status(200).json({ question });
});

export const createQuestionController = asyncHandler(async (req, res) => {
  const { prompt, type, content, hint, explanation } = req.validatedBody;
  const validatedContent = validateQuestionContent(type, content);
  const question = await questionService.create({
    prompt,
    type,
    content: validatedContent,
    createdById: req.user.id,
    hint,
    explanation,
  });
  res.status(201).json({ question });
});

export const updateQuestionController = asyncHandler(async (req, res) => {
  const { prompt, type, content, hint, explanation } = req.validatedBody;
  let validatedContent;
  if (content !== undefined) {
    // Full (unstripped) content needed to determine the effective type -- role "instructor" here
    // just selects the unstripped shape, it isn't an authorization decision (that already
    // happened via requireQuestionEditAccess before this controller runs).
    const existing = await questionService.getById(Number(req.params.questionId), "instructor");
    validatedContent = validateQuestionContent(type ?? existing.type, content);
  }
  const question = await questionService.update(Number(req.params.questionId), {
    prompt,
    type,
    content: validatedContent,
    hint,
    explanation,
  });
  res.status(200).json({ question });
});

export const deleteQuestionController = asyncHandler(async (req, res) => {
  await questionService.remove(Number(req.params.questionId));
  res.status(200).end();
});
