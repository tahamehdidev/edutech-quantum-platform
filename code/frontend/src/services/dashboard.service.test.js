import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { dashboardService } from "./dashboard.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("getCompletion fetches /cohorts/:id/dashboard/completion and returns the full body", async () => {
  const body = { courses: [{ courseId: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await dashboardService.getCompletion(2);
  expect(apiClient.get).toHaveBeenCalledWith("/cohorts/2/dashboard/completion");
  expect(result).toEqual(body);
});

test("getLessonPacing fetches /cohorts/:id/dashboard/lesson-pacing and returns the full body", async () => {
  const body = { lessons: [{ lessonId: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await dashboardService.getLessonPacing(2);
  expect(apiClient.get).toHaveBeenCalledWith("/cohorts/2/dashboard/lesson-pacing");
  expect(result).toEqual(body);
});
