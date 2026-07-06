import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { chapterService } from "./chapter.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("listForCourse fetches /courses/:id/chapters and returns the full body", async () => {
  const body = { chapters: [{ id: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await chapterService.listForCourse(5);
  expect(apiClient.get).toHaveBeenCalledWith("/courses/5/chapters");
  expect(result).toEqual(body);
});

test("create posts to /courses/:id/chapters and returns the created chapter", async () => {
  apiClient.post.mockResolvedValue({ data: { chapter: { id: 2, title: "Ch1" } } });
  const result = await chapterService.create(5, { title: "Ch1" });
  expect(apiClient.post).toHaveBeenCalledWith("/courses/5/chapters", { title: "Ch1" });
  expect(result).toEqual({ id: 2, title: "Ch1" });
});

test("update patches /chapters/:id and returns the updated chapter", async () => {
  apiClient.patch.mockResolvedValue({ data: { chapter: { id: 2, title: "Renamed" } } });
  const result = await chapterService.update(2, { title: "Renamed" });
  expect(apiClient.patch).toHaveBeenCalledWith("/chapters/2", { title: "Renamed" });
  expect(result).toEqual({ id: 2, title: "Renamed" });
});

test("reorder patches /courses/:id/chapters/reorder with the full ordered id list", async () => {
  apiClient.patch.mockResolvedValue({});
  await chapterService.reorder(5, [3, 1, 2]);
  expect(apiClient.patch).toHaveBeenCalledWith("/courses/5/chapters/reorder", {
    orderedIds: [3, 1, 2],
  });
});

test("remove with confirm sends confirm=true", async () => {
  apiClient.delete.mockResolvedValue({});
  await chapterService.remove(2, { confirm: true });
  expect(apiClient.delete).toHaveBeenCalledWith("/chapters/2", { params: { confirm: "true" } });
});
