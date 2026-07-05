import { asyncHandler } from "../utils/asyncHandler.js";
import { screenService } from "../services/screen.service.js";
import { validateScreenContent } from "../validators/screen.validator.js";

export const listScreensController = asyncHandler(async (req, res) => {
  const screens = await screenService.listForLesson(Number(req.params.lessonId));
  res
    .status(200)
    .json({ screens, pagination: { page: 1, limit: screens.length, total: screens.length } });
});

export const createScreenController = asyncHandler(async (req, res) => {
  const { type, content } = req.validatedBody;
  // Branches on the sibling `type` field, which a single declarative validateBody schema can't
  // do -- runs here, in the controller, per 03-security-architecture.md §5.3.
  const validatedContent = validateScreenContent(type, content);
  const screen = await screenService.create(Number(req.params.lessonId), {
    type,
    content: validatedContent,
  });
  res.status(201).json({ screen });
});

export const updateScreenController = asyncHandler(async (req, res) => {
  const { type, content } = req.validatedBody;
  const existing =
    content !== undefined ? await screenService.getById(Number(req.params.screenId)) : null;
  const effectiveType = type ?? existing?.type;
  const validatedContent =
    content !== undefined ? validateScreenContent(effectiveType, content) : undefined;
  const screen = await screenService.update(Number(req.params.screenId), {
    type,
    content: validatedContent,
  });
  res.status(200).json({ screen });
});

export const reorderScreensController = asyncHandler(async (req, res) => {
  await screenService.reorder(Number(req.params.lessonId), req.validatedBody.orderedIds);
  res.status(200).end();
});

// Leaf node -- no ?confirm=true (02-api-contract.md §3.5).
export const deleteScreenController = asyncHandler(async (req, res) => {
  await screenService.remove(Number(req.params.screenId));
  res.status(200).end();
});
