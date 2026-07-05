import { asyncHandler } from "../utils/asyncHandler.js";
import { chapterService } from "../services/chapter.service.js";

export const listChaptersController = asyncHandler(async (req, res) => {
  const chapters = await chapterService.listForCourse(Number(req.params.courseId));
  res
    .status(200)
    .json({ chapters, pagination: { page: 1, limit: chapters.length, total: chapters.length } });
});

export const createChapterController = asyncHandler(async (req, res) => {
  const chapter = await chapterService.create(Number(req.params.courseId), req.validatedBody);
  res.status(201).json({ chapter });
});

export const updateChapterController = asyncHandler(async (req, res) => {
  const chapter = await chapterService.update(Number(req.params.chapterId), req.validatedBody);
  res.status(200).json({ chapter });
});

export const reorderChaptersController = asyncHandler(async (req, res) => {
  await chapterService.reorder(Number(req.params.courseId), req.validatedBody.orderedIds);
  res.status(200).end();
});

export const deleteChapterController = asyncHandler(async (req, res) => {
  await chapterService.remove(Number(req.params.chapterId), {
    confirm: req.query.confirm,
    deletedByUserId: req.user.id,
  });
  res.status(200).end();
});
