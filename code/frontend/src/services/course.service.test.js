import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { courseService } from "./course.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("list fetches /courses and returns the full { courses, pagination } body", async () => {
  const body = { courses: [{ id: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await courseService.list();
  expect(apiClient.get).toHaveBeenCalledWith("/courses");
  expect(result).toEqual(body);
});

test("getById fetches /courses/:id and returns the course", async () => {
  apiClient.get.mockResolvedValue({ data: { course: { id: 5, chapters: [] } } });
  const result = await courseService.getById(5);
  expect(apiClient.get).toHaveBeenCalledWith("/courses/5");
  expect(result).toEqual({ id: 5, chapters: [] });
});

test("create posts to /courses and returns the created course", async () => {
  apiClient.post.mockResolvedValue({ data: { course: { id: 6, title: "New" } } });
  const result = await courseService.create({ title: "New", narrative: "n" });
  expect(apiClient.post).toHaveBeenCalledWith("/courses", { title: "New", narrative: "n" });
  expect(result).toEqual({ id: 6, title: "New" });
});

test("update patches /courses/:id and returns the updated course", async () => {
  apiClient.patch.mockResolvedValue({ data: { course: { id: 5, title: "Renamed" } } });
  const result = await courseService.update(5, { title: "Renamed" });
  expect(apiClient.patch).toHaveBeenCalledWith("/courses/5", {
    title: "Renamed",
    narrative: undefined,
  });
  expect(result).toEqual({ id: 5, title: "Renamed" });
});

test("remove without confirm sends no confirm param", async () => {
  apiClient.delete.mockResolvedValue({});
  await courseService.remove(5);
  expect(apiClient.delete).toHaveBeenCalledWith("/courses/5", { params: undefined });
});

test("remove with confirm sends confirm=true", async () => {
  apiClient.delete.mockResolvedValue({});
  await courseService.remove(5, { confirm: true });
  expect(apiClient.delete).toHaveBeenCalledWith("/courses/5", { params: { confirm: "true" } });
});
