import { apiClient } from "./apiClient.js";

// Read-only, aggregated (02-api-contract.md §7.1) -- both return one entry per course/lesson a
// cohort's students have touched, not a single object, since a Cohort can span multiple courses.
async function getCompletion(cohortId) {
  const { data } = await apiClient.get(`/cohorts/${cohortId}/dashboard/completion`);
  return data; // { courses, pagination }
}

async function getLessonPacing(cohortId) {
  const { data } = await apiClient.get(`/cohorts/${cohortId}/dashboard/lesson-pacing`);
  return data; // { lessons, pagination }
}

export const dashboardService = { getCompletion, getLessonPacing };
