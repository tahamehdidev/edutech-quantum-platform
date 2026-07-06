import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { screenService } from "./screen.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("listForLesson fetches /lessons/:id/screens and returns the full body", async () => {
  const body = { screens: [{ id: 1 }], pagination: { page: 1, limit: 1, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await screenService.listForLesson(4);
  expect(apiClient.get).toHaveBeenCalledWith("/lessons/4/screens");
  expect(result).toEqual(body);
});

test("create posts to /lessons/:id/screens and returns the created screen", async () => {
  apiClient.post.mockResolvedValue({ data: { screen: { id: 7, type: "explanation" } } });
  const result = await screenService.create(4, { type: "explanation", content: { text: "hi" } });
  expect(apiClient.post).toHaveBeenCalledWith("/lessons/4/screens", {
    type: "explanation",
    content: { text: "hi" },
  });
  expect(result).toEqual({ id: 7, type: "explanation" });
});

test("update patches /screens/:id and returns the updated screen", async () => {
  apiClient.patch.mockResolvedValue({ data: { screen: { id: 7, type: "question" } } });
  const result = await screenService.update(7, { type: "question", content: {} });
  expect(apiClient.patch).toHaveBeenCalledWith("/screens/7", { type: "question", content: {} });
  expect(result).toEqual({ id: 7, type: "question" });
});

test("reorder patches /lessons/:id/screens/reorder with the full ordered id list", async () => {
  apiClient.patch.mockResolvedValue({});
  await screenService.reorder(4, [9, 8, 7]);
  expect(apiClient.patch).toHaveBeenCalledWith("/lessons/4/screens/reorder", {
    orderedIds: [9, 8, 7],
  });
});

test("remove sends no confirm param -- leaf node", async () => {
  apiClient.delete.mockResolvedValue({});
  await screenService.remove(7);
  expect(apiClient.delete).toHaveBeenCalledWith("/screens/7");
});

test("attachQuestion posts to /screens/:id/questions with the questionId", async () => {
  apiClient.post.mockResolvedValue({});
  await screenService.attachQuestion(7, 41);
  expect(apiClient.post).toHaveBeenCalledWith("/screens/7/questions", { questionId: 41 });
});

test("detachQuestion deletes /screens/:id/questions/:questionId", async () => {
  apiClient.delete.mockResolvedValue({});
  await screenService.detachQuestion(7, 41);
  expect(apiClient.delete).toHaveBeenCalledWith("/screens/7/questions/41");
});
