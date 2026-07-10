import { apiClient } from "./apiClient.js";

async function listForChapter(chapterId) {
  const { data } = await apiClient.get(`/chapters/${chapterId}/lessons`);
  return data; // { lessons, pagination }
}

async function getById(lessonId) {
  const { data } = await apiClient.get(`/lessons/${lessonId}`);
  return data.lesson;
}

async function create(chapterId, { title }) {
  const { data } = await apiClient.post(`/chapters/${chapterId}/lessons`, { title });
  return data.lesson;
}

async function update(lessonId, { title }) {
  const { data } = await apiClient.patch(`/lessons/${lessonId}`, { title });
  return data.lesson;
}

async function reorder(chapterId, orderedIds) {
  await apiClient.patch(`/chapters/${chapterId}/lessons/reorder`, { orderedIds });
}

async function remove(lessonId, { confirm = false } = {}) {
  await apiClient.delete(`/lessons/${lessonId}`, {
    params: confirm ? { confirm: "true" } : undefined,
  });
}

export const lessonService = { listForChapter, getById, create, update, reorder, remove };
