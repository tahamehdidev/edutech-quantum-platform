import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { practiceSetService } from "./practiceSet.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("listForLesson fetches /lessons/:id/practice-sets and returns the full body", async () => {
  const body = { practiceSets: [{ id: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await practiceSetService.listForLesson(4);
  expect(apiClient.get).toHaveBeenCalledWith("/lessons/4/practice-sets");
  expect(result).toEqual(body);
});

test("getById fetches /practice-sets/:id and returns the practice set", async () => {
  apiClient.get.mockResolvedValue({ data: { practiceSet: { id: 2, questions: [] } } });
  const result = await practiceSetService.getById(2);
  expect(apiClient.get).toHaveBeenCalledWith("/practice-sets/2");
  expect(result).toEqual({ id: 2, questions: [] });
});

test("create posts to /lessons/:id/practice-sets and returns the created practice set", async () => {
  apiClient.post.mockResolvedValue({ data: { practiceSet: { id: 3, title: "Practice" } } });
  const result = await practiceSetService.create(4, { title: "Practice" });
  expect(apiClient.post).toHaveBeenCalledWith("/lessons/4/practice-sets", { title: "Practice" });
  expect(result).toEqual({ id: 3, title: "Practice" });
});

test("update patches /practice-sets/:id and returns the updated practice set", async () => {
  apiClient.patch.mockResolvedValue({ data: { practiceSet: { id: 3, title: "Renamed" } } });
  const result = await practiceSetService.update(3, { title: "Renamed" });
  expect(apiClient.patch).toHaveBeenCalledWith("/practice-sets/3", { title: "Renamed" });
  expect(result).toEqual({ id: 3, title: "Renamed" });
});

test("remove deletes /practice-sets/:id", async () => {
  apiClient.delete.mockResolvedValue({});
  await practiceSetService.remove(3);
  expect(apiClient.delete).toHaveBeenCalledWith("/practice-sets/3");
});

test("attachQuestion posts to /practice-sets/:id/questions with the questionId", async () => {
  apiClient.post.mockResolvedValue({});
  await practiceSetService.attachQuestion(3, 41);
  expect(apiClient.post).toHaveBeenCalledWith("/practice-sets/3/questions", { questionId: 41 });
});

test("detachQuestion deletes /practice-sets/:id/questions/:questionId", async () => {
  apiClient.delete.mockResolvedValue({});
  await practiceSetService.detachQuestion(3, 41);
  expect(apiClient.delete).toHaveBeenCalledWith("/practice-sets/3/questions/41");
});

test("reorderQuestions patches /practice-sets/:id/questions/reorder with the full ordered id list", async () => {
  apiClient.patch.mockResolvedValue({});
  await practiceSetService.reorderQuestions(3, [41, 42]);
  expect(apiClient.patch).toHaveBeenCalledWith("/practice-sets/3/questions/reorder", {
    orderedIds: [41, 42],
  });
});
