import { apiClient } from "./apiClient.js";

async function listForLesson(lessonId) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/screens`);
  return data; // { screens, pagination } -- each screen's embedded questions are already
  // shaped per caller role by the backend (02-api-contract.md §4.4)
}

async function create(lessonId, { type, content }) {
  const { data } = await apiClient.post(`/lessons/${lessonId}/screens`, { type, content });
  return data.screen;
}

async function update(screenId, { type, content }) {
  const { data } = await apiClient.patch(`/screens/${screenId}`, { type, content });
  return data.screen;
}

async function reorder(lessonId, orderedIds) {
  await apiClient.patch(`/lessons/${lessonId}/screens/reorder`, { orderedIds });
}

// Leaf node -- no ?confirm=true (02-api-contract.md §3.5).
async function remove(screenId) {
  await apiClient.delete(`/screens/${screenId}`);
}

async function attachQuestion(screenId, questionId) {
  await apiClient.post(`/screens/${screenId}/questions`, { questionId });
}

async function detachQuestion(screenId, questionId) {
  await apiClient.delete(`/screens/${screenId}/questions/${questionId}`);
}

export const screenService = {
  listForLesson,
  create,
  update,
  reorder,
  remove,
  attachQuestion,
  detachQuestion,
};
