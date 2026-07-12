import { apiClient } from "./apiClient.js";

// userId is never accepted by the backend from anywhere but the authenticated session
// (02-api-contract.md §5.3) -- there is no userId param here to mirror that.
async function submit({ questionId, contextType, contextId, answer }) {
  const { data } = await apiClient.post("/attempts", {
    questionId,
    contextType,
    contextId,
    answer,
  });
  // correctAnswer is present only when isCorrect is false, shaped like the submitted `answer`
  // ({ selectedOptionIndex } / { order } / { value }) -- powers the opt-in "See answer" action
  // (Frontend Milestone 6). Never present on a correct attempt.
  return data.attempt; // { id, questionId, isCorrect, xpAwarded, attemptedAt, correctAnswer? }
}

// userId defaults to "me" (own history, any role); courseId is required by the backend when
// userId targets someone else and the caller is an instructor (02-api-contract.md §5.2) -- that
// validation lives server-side, not duplicated here.
async function listForUser({ userId = "me", courseId } = {}) {
  const { data } = await apiClient.get("/attempts", { params: { userId, courseId } });
  return data; // { attempts, pagination }
}

export const attemptService = { submit, listForUser };
