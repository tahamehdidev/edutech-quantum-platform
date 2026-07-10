import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { lessonService } from "./lesson.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("listForChapter fetches /chapters/:id/lessons and returns the full body", async () => {
  const body = { lessons: [{ id: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await lessonService.listForChapter(2);
  expect(apiClient.get).toHaveBeenCalledWith("/chapters/2/lessons");
  expect(result).toEqual(body);
});

test("getById fetches /lessons/:id and returns the lesson", async () => {
  apiClient.get.mockResolvedValue({ data: { lesson: { id: 3, title: "Qubits 101" } } });
  const result = await lessonService.getById(3);
  expect(apiClient.get).toHaveBeenCalledWith("/lessons/3");
  expect(result).toEqual({ id: 3, title: "Qubits 101" });
});

test("create posts to /chapters/:id/lessons and returns the created lesson", async () => {
  apiClient.post.mockResolvedValue({ data: { lesson: { id: 3, title: "L1" } } });
  const result = await lessonService.create(2, { title: "L1" });
  expect(apiClient.post).toHaveBeenCalledWith("/chapters/2/lessons", { title: "L1" });
  expect(result).toEqual({ id: 3, title: "L1" });
});

test("update patches /lessons/:id and returns the updated lesson", async () => {
  apiClient.patch.mockResolvedValue({ data: { lesson: { id: 3, title: "Renamed" } } });
  const result = await lessonService.update(3, { title: "Renamed" });
  expect(apiClient.patch).toHaveBeenCalledWith("/lessons/3", { title: "Renamed" });
  expect(result).toEqual({ id: 3, title: "Renamed" });
});

test("reorder patches /chapters/:id/lessons/reorder with the full ordered id list", async () => {
  apiClient.patch.mockResolvedValue({});
  await lessonService.reorder(2, [5, 4]);
  expect(apiClient.patch).toHaveBeenCalledWith("/chapters/2/lessons/reorder", {
    orderedIds: [5, 4],
  });
});

test("remove with confirm sends confirm=true", async () => {
  apiClient.delete.mockResolvedValue({});
  await lessonService.remove(3, { confirm: true });
  expect(apiClient.delete).toHaveBeenCalledWith("/lessons/3", { params: { confirm: "true" } });
});
