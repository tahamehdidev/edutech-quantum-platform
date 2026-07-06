import { courseRepository } from "../repositories/course.repository.js";
import { auditLogService } from "./auditLog.service.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/index.js";

async function list() {
  return courseRepository.findAll();
}

async function getById(id) {
  const course = await courseRepository.findById(id);
  if (!course) throw new NotFoundError("Course not found.");
  return course;
}

async function create({ title, narrative, createdById }) {
  return courseRepository.create({ title, narrative, createdById });
}

async function update(id, { title, narrative }) {
  const course = await courseRepository.update(id, { title, narrative });
  if (!course) throw new NotFoundError("Course not found.");
  return course;
}

// 02-api-contract.md §3.5 -- cascading delete requires ?confirm=true, checked here (not in the
// controller) so the rule lives in exactly one place regardless of caller.
async function remove(id, { confirm, deletedByUserId }) {
  const course = await courseRepository.findById(id);
  if (!course) throw new NotFoundError("Course not found.");

  if (confirm !== "true") {
    const counts = await courseRepository.getCascadeCounts(id);
    throw new ValidationError(
      `Deleting this course will also delete ${counts.chapter_count} chapter(s), ${counts.lesson_count} lesson(s), and ${counts.screen_count} screen(s). Pass ?confirm=true to proceed.`,
      "confirm"
    );
  }

  // Cascade counts fetched before delete, for the audit entry's metadata
  // (04-application-architecture.md §1.1) -- the DB cascade itself happens via
  // Course->Chapter->Lesson->Screen's ON DELETE CASCADE (01-data-model.md).
  const counts = await courseRepository.getCascadeCounts(id);
  await courseRepository.deleteById(id);
  await auditLogService.record({
    userId: deletedByUserId,
    action: "course.deleted",
    resourceType: "Course",
    resourceId: String(id),
    metadata: {
      cascadedChapters: Number(counts.chapter_count),
      cascadedLessons: Number(counts.lesson_count),
      cascadedScreens: Number(counts.screen_count),
    },
  });
}

// Resolves which Course a request's params refer to, whichever depth it operates at -- used only
// by ownership.middleware.js's requireCourseOwnership (03-security-architecture.md §3.4 Variant
// C). Route files name their param after their own resource (courseId/chapterId/lessonId/
// screenId), so exactly one of these is ever present on a given request.
async function resolveCourseId(params) {
  if (params.courseId) return Number(params.courseId);
  if (params.chapterId) return courseRepository.resolveFromChapterId(Number(params.chapterId));
  if (params.lessonId) return courseRepository.resolveFromLessonId(Number(params.lessonId));
  if (params.screenId) return courseRepository.resolveFromScreenId(Number(params.screenId));
  if (params.practiceSetId) {
    return courseRepository.resolveFromPracticeSetId(Number(params.practiceSetId));
  }
  throw new Error(
    "resolveCourseId: no courseId/chapterId/lessonId/screenId/practiceSetId param present on this request."
  );
}

async function checkOwnership(userId, courseId) {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new NotFoundError("Course not found.");
  if (course.created_by_id !== userId) throw new ForbiddenError("You do not own this course.");
  return course;
}

export const courseService = {
  list,
  getById,
  create,
  update,
  remove,
  resolveCourseId,
  checkOwnership,
};
