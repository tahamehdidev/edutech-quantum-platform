import { lessonRepository } from "../repositories/lesson.repository.js";
import { auditLogService } from "./auditLog.service.js";
import { isExactSetMatch } from "../utils/exactSetMatch.js";
import { NotFoundError, ValidationError, ReorderSetMismatchError } from "../errors/index.js";

async function listForChapter(chapterId) {
  return lessonRepository.findAllForChapter(chapterId);
}

async function getById(id) {
  const lesson = await lessonRepository.findById(id);
  if (!lesson) throw new NotFoundError("Lesson not found.");
  return lesson;
}

async function create(chapterId, { title }) {
  return lessonRepository.create({ chapterId, title });
}

async function update(id, { title }) {
  const lesson = await lessonRepository.update(id, { title });
  if (!lesson) throw new NotFoundError("Lesson not found.");
  return lesson;
}

async function reorder(chapterId, orderedIds) {
  const actualIds = await lessonRepository.findSiblingIds(chapterId);
  if (!isExactSetMatch(actualIds, orderedIds)) {
    throw new ReorderSetMismatchError();
  }
  await lessonRepository.applyOrder(orderedIds);
}

async function remove(id, { confirm, deletedByUserId }) {
  const lesson = await lessonRepository.findById(id);
  if (!lesson) throw new NotFoundError("Lesson not found.");

  if (confirm !== "true") {
    const counts = await lessonRepository.getCascadeCounts(id);
    throw new ValidationError(
      `Deleting this lesson will also delete ${counts.screen_count} screen(s). Pass ?confirm=true to proceed.`,
      "confirm"
    );
  }

  const counts = await lessonRepository.getCascadeCounts(id);
  await lessonRepository.deleteById(id);
  await auditLogService.record({
    userId: deletedByUserId,
    action: "lesson.deleted",
    resourceType: "Lesson",
    resourceId: String(id),
    metadata: { cascadedScreens: Number(counts.screen_count) },
  });
}

export const lessonService = { listForChapter, getById, create, update, reorder, remove };
