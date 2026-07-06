import { apiClient } from "./apiClient.js";

async function listForCourse(courseId) {
  const { data } = await apiClient.get(`/courses/${courseId}/chapters`);
  return data; // { chapters, pagination }
}

async function create(courseId, { title }) {
  const { data } = await apiClient.post(`/courses/${courseId}/chapters`, { title });
  return data.chapter;
}

async function update(chapterId, { title }) {
  const { data } = await apiClient.patch(`/chapters/${chapterId}`, { title });
  return data.chapter;
}

// Server validates an exact-set match against actual current siblings (02-api-contract.md §9) --
// send the full ordered sibling-id list, never a partial one.
async function reorder(courseId, orderedIds) {
  await apiClient.patch(`/courses/${courseId}/chapters/reorder`, { orderedIds });
}

async function remove(chapterId, { confirm = false } = {}) {
  await apiClient.delete(`/chapters/${chapterId}`, {
    params: confirm ? { confirm: "true" } : undefined,
  });
}

export const chapterService = { listForCourse, create, update, reorder, remove };
