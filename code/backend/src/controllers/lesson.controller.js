import { asyncHandler } from "../utils/asyncHandler.js";
import { lessonService } from "../services/lesson.service.js";

export const listLessonsController = asyncHandler(async (req, res) => {
  const lessons = await lessonService.listForChapter(Number(req.params.chapterId));
  res
    .status(200)
    .json({ lessons, pagination: { page: 1, limit: lessons.length, total: lessons.length } });
});

export const createLessonController = asyncHandler(async (req, res) => {
  const lesson = await lessonService.create(Number(req.params.chapterId), req.validatedBody);
  res.status(201).json({ lesson });
});

export const updateLessonController = asyncHandler(async (req, res) => {
  const lesson = await lessonService.update(Number(req.params.lessonId), req.validatedBody);
  res.status(200).json({ lesson });
});

export const reorderLessonsController = asyncHandler(async (req, res) => {
  await lessonService.reorder(Number(req.params.chapterId), req.validatedBody.orderedIds);
  res.status(200).end();
});

export const deleteLessonController = asyncHandler(async (req, res) => {
  await lessonService.remove(Number(req.params.lessonId), {
    confirm: req.query.confirm,
    deletedByUserId: req.user.id,
  });
  res.status(200).end();
});
