import { apiClient } from "./apiClient.js";

async function listForLesson(lessonId) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/practice-sets`);
  return data; // { practiceSets, pagination }
}

// Includes the ordered, embedded questions (02-api-contract.md §4.2's "Get one (with ordered
// questions)"), already shaped per caller role by the backend.
async function getById(practiceSetId) {
  const { data } = await apiClient.get(`/practice-sets/${practiceSetId}`);
  return data.practiceSet;
}

async function create(lessonId, { title }) {
  const { data } = await apiClient.post(`/lessons/${lessonId}/practice-sets`, { title });
  return data.practiceSet;
}

async function update(practiceSetId, { title }) {
  const { data } = await apiClient.patch(`/practice-sets/${practiceSetId}`, { title });
  return data.practiceSet;
}

async function remove(practiceSetId) {
  await apiClient.delete(`/practice-sets/${practiceSetId}`);
}

async function attachQuestion(practiceSetId, questionId) {
  await apiClient.post(`/practice-sets/${practiceSetId}/questions`, { questionId });
}

async function detachQuestion(practiceSetId, questionId) {
  await apiClient.delete(`/practice-sets/${practiceSetId}/questions/${questionId}`);
}

async function reorderQuestions(practiceSetId, orderedIds) {
  await apiClient.patch(`/practice-sets/${practiceSetId}/questions/reorder`, { orderedIds });
}

export const practiceSetService = {
  listForLesson,
  getById,
  create,
  update,
  remove,
  attachQuestion,
  detachQuestion,
  reorderQuestions,
};
