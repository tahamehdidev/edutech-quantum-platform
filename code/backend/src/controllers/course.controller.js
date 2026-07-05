import { asyncHandler } from "../utils/asyncHandler.js";
import { courseService } from "../services/course.service.js";
import { chapterService } from "../services/chapter.service.js";

export const listCoursesController = asyncHandler(async (req, res) => {
  const courses = await courseService.list();
  res
    .status(200)
    .json({ courses, pagination: { page: 1, limit: courses.length, total: courses.length } });
});

// Nested chapters per 02-api-contract.md's "Get one course (nested chapters)" -- composing two
// services at the controller layer, not inside course.service.js itself, since Course has no
// business-logic reason to know about Chapter's shape beyond this one read composition.
export const getCourseController = asyncHandler(async (req, res) => {
  const course = await courseService.getById(Number(req.params.courseId));
  const chapters = await chapterService.listForCourse(course.id);
  res.status(200).json({ course: { ...course, chapters } });
});

export const createCourseController = asyncHandler(async (req, res) => {
  const course = await courseService.create({ ...req.validatedBody, createdById: req.user.id });
  res.status(201).json({ course });
});

export const updateCourseController = asyncHandler(async (req, res) => {
  const course = await courseService.update(Number(req.params.courseId), req.validatedBody);
  res.status(200).json({ course });
});

export const deleteCourseController = asyncHandler(async (req, res) => {
  await courseService.remove(Number(req.params.courseId), {
    confirm: req.query.confirm,
    deletedByUserId: req.user.id,
  });
  res.status(200).end();
});
