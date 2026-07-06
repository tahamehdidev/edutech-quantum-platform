import { apiClient } from "./apiClient.js";

// The only genuinely paginated list in this API (02-api-contract.md §4.3) -- page/limit are real
// query params, not decorative.
async function list({ search, type, page = 1, limit = 20 } = {}) {
  const { data } = await apiClient.get("/questions", { params: { search, type, page, limit } });
  return data; // { questions, pagination }
}

async function getById(questionId) {
  const { data } = await apiClient.get(`/questions/${questionId}`);
  return data.question;
}

async function create({ prompt, type, content }) {
  const { data } = await apiClient.post("/questions", { prompt, type, content });
  return data.question;
}

async function update(questionId, { prompt, type, content }) {
  const { data } = await apiClient.patch(`/questions/${questionId}`, { prompt, type, content });
  return data.question;
}

// Cascades silently to every screen/practice set it was attached to, no pre-check
// (02-api-contract.md §4.5) -- a deliberate backend behavior, not something to warn about here.
async function remove(questionId) {
  await apiClient.delete(`/questions/${questionId}`);
}

export const questionService = { list, getById, create, update, remove };
