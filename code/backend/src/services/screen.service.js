import { screenRepository } from "../repositories/screen.repository.js";
import { isExactSetMatch } from "../utils/exactSetMatch.js";
import { NotFoundError, ReorderSetMismatchError } from "../errors/index.js";

async function listForLesson(lessonId) {
  return screenRepository.findAllForLesson(lessonId);
}

async function getById(id) {
  const screen = await screenRepository.findById(id);
  if (!screen) throw new NotFoundError("Screen not found.");
  return screen;
}

// content has already been validated against its type-branching schema in the controller
// (03-security-architecture.md §5.3) -- this layer just persists it.
async function create(lessonId, { type, content }) {
  return screenRepository.create({ lessonId, type, content });
}

async function update(id, { type, content }) {
  const screen = await screenRepository.update(id, { type, content });
  if (!screen) throw new NotFoundError("Screen not found.");
  return screen;
}

async function reorder(lessonId, orderedIds) {
  const actualIds = await screenRepository.findSiblingIds(lessonId);
  if (!isExactSetMatch(actualIds, orderedIds)) {
    throw new ReorderSetMismatchError();
  }
  await screenRepository.applyOrder(orderedIds);
}

// Leaf node -- no ?confirm=true (nothing cascades), no AuditLog entry (not in the scoped action
// list; 01-data-model.md §3's Course/Chapter/Lesson note is the only cascade-confirm boundary).
async function remove(id) {
  const screen = await screenRepository.findById(id);
  if (!screen) throw new NotFoundError("Screen not found.");
  await screenRepository.deleteById(id);
}

export const screenService = { listForLesson, getById, create, update, reorder, remove };
