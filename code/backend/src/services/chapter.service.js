import { chapterRepository } from "../repositories/chapter.repository.js";
import { auditLogService } from "./auditLog.service.js";
import { isExactSetMatch } from "../utils/exactSetMatch.js";
import { NotFoundError, ValidationError, ReorderSetMismatchError } from "../errors/index.js";

async function listForCourse(courseId) {
  return chapterRepository.findAllForCourse(courseId);
}

async function getById(id) {
  const chapter = await chapterRepository.findById(id);
  if (!chapter) throw new NotFoundError("Chapter not found.");
  return chapter;
}

// Ownership of the parent course is already checked by requireCourseOwnership before this runs
// (03-security-architecture.md §3.1 -- creates under a parent are ownership-gated on the parent).
async function create(courseId, { title }) {
  return chapterRepository.create({ courseId, title });
}

async function update(id, { title }) {
  const chapter = await chapterRepository.update(id, { title });
  if (!chapter) throw new NotFoundError("Chapter not found.");
  return chapter;
}

async function reorder(courseId, orderedIds) {
  const actualIds = await chapterRepository.findSiblingIds(courseId);
  if (!isExactSetMatch(actualIds, orderedIds)) {
    throw new ReorderSetMismatchError();
  }
  await chapterRepository.applyOrder(orderedIds);
}

async function remove(id, { confirm, deletedByUserId }) {
  const chapter = await chapterRepository.findById(id);
  if (!chapter) throw new NotFoundError("Chapter not found.");

  if (confirm !== "true") {
    const counts = await chapterRepository.getCascadeCounts(id);
    throw new ValidationError(
      `Deleting this chapter will also delete ${counts.lesson_count} lesson(s) and ${counts.screen_count} screen(s). Pass ?confirm=true to proceed.`,
      "confirm"
    );
  }

  const counts = await chapterRepository.getCascadeCounts(id);
  await chapterRepository.deleteById(id);
  await auditLogService.record({
    userId: deletedByUserId,
    action: "chapter.deleted",
    resourceType: "Chapter",
    resourceId: String(id),
    metadata: {
      cascadedLessons: Number(counts.lesson_count),
      cascadedScreens: Number(counts.screen_count),
    },
  });
}

export const chapterService = { listForCourse, getById, create, update, reorder, remove };
