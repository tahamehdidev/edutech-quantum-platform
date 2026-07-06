import { apiClient } from "./apiClient.js";

async function list() {
  const { data } = await apiClient.get("/courses");
  return data; // { courses, pagination }
}

// Includes nested chapters (02-api-contract.md's "Get one course" shape).
async function getById(courseId) {
  const { data } = await apiClient.get(`/courses/${courseId}`);
  return data.course;
}

async function create({ title, narrative }) {
  const { data } = await apiClient.post("/courses", { title, narrative });
  return data.course;
}

async function update(courseId, { title, narrative }) {
  const { data } = await apiClient.patch(`/courses/${courseId}`, { title, narrative });
  return data.course;
}

// confirm must be explicit and true -- omitting it gets a 400 back with the cascade counts
// (02-api-contract.md §3.5), which the caller is expected to show the user before retrying.
async function remove(courseId, { confirm = false } = {}) {
  await apiClient.delete(`/courses/${courseId}`, {
    params: confirm ? { confirm: "true" } : undefined,
  });
}

export const courseService = { list, getById, create, update, remove };
