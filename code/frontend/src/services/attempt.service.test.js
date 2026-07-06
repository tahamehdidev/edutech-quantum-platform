import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { attemptService } from "./attempt.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("submit posts to /attempts with no userId field and returns the attempt", async () => {
  const attempt = { id: 1, questionId: 41, isCorrect: true, xpAwarded: true };
  apiClient.post.mockResolvedValue({ data: { attempt } });
  const result = await attemptService.submit({
    questionId: 41,
    contextType: "screen",
    contextId: 12,
    answer: { selectedOptionIndex: 1 },
  });
  expect(apiClient.post).toHaveBeenCalledWith("/attempts", {
    questionId: 41,
    contextType: "screen",
    contextId: 12,
    answer: { selectedOptionIndex: 1 },
  });
  expect(apiClient.post.mock.calls[0][1]).not.toHaveProperty("userId");
  expect(result).toEqual(attempt);
});

test("listForUser defaults userId to 'me' and returns the full body", async () => {
  const body = { attempts: [], pagination: { page: 1, limit: 0, total: 0 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await attemptService.listForUser();
  expect(apiClient.get).toHaveBeenCalledWith("/attempts", {
    params: { userId: "me", courseId: undefined },
  });
  expect(result).toEqual(body);
});

test("listForUser passes an explicit userId and courseId through", async () => {
  apiClient.get.mockResolvedValue({ data: { attempts: [], pagination: {} } });
  await attemptService.listForUser({ userId: "u1", courseId: 3 });
  expect(apiClient.get).toHaveBeenCalledWith("/attempts", {
    params: { userId: "u1", courseId: 3 },
  });
});
