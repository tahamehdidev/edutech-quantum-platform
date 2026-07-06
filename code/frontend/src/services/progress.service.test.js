import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { progressService } from "./progress.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("listForUser defaults userId to 'me' and returns the full body", async () => {
  const body = { progress: [], pagination: { page: 1, limit: 0, total: 0 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await progressService.listForUser();
  expect(apiClient.get).toHaveBeenCalledWith("/progress", {
    params: { userId: "me", courseId: undefined },
  });
  expect(result).toEqual(body);
});

test("listForUser passes an explicit userId and courseId through", async () => {
  apiClient.get.mockResolvedValue({ data: { progress: [], pagination: {} } });
  await progressService.listForUser({ userId: "u1", courseId: 3 });
  expect(apiClient.get).toHaveBeenCalledWith("/progress", {
    params: { userId: "u1", courseId: 3 },
  });
});

// The point of this milestone's own "done when": mirrors the backend's tested discipline of
// proving an absence, not just an intended one -- a future PR adding a write function here
// would have to consciously break this test, not just slip past code review unnoticed.
test("progress.service.js exposes no write function at all -- mirrors the backend's own absence (02-api-contract.md §5.1)", () => {
  expect(Object.keys(progressService)).toEqual(["listForUser"]);
});
