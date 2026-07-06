import { apiClient } from "./apiClient.js";

// No write function here at all -- deliberately, mirroring the backend's own absence
// (02-api-contract.md §5.1). xp/current_streak/level/completed_at only ever change as a side
// effect of attemptService.submit(); a write function here would just be a client-side path to a
// capability the backend was never built to accept.
async function listForUser({ userId = "me", courseId } = {}) {
  const { data } = await apiClient.get("/progress", { params: { userId, courseId } });
  return data; // { progress, pagination }
}

export const progressService = { listForUser };
