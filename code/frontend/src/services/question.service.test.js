import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { questionService } from "./question.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("list defaults page/limit and passes search/type through as query params", async () => {
  const body = { questions: [{ id: 1 }], pagination: { page: 1, limit: 20, total: 1 } };
  apiClient.get.mockResolvedValue({ data: body });
  const result = await questionService.list({ search: "qubit", type: "mcq" });
  expect(apiClient.get).toHaveBeenCalledWith("/questions", {
    params: { search: "qubit", type: "mcq", page: 1, limit: 20 },
  });
  expect(result).toEqual(body);
});

test("list with no args still sends default page/limit", async () => {
  apiClient.get.mockResolvedValue({ data: { questions: [], pagination: {} } });
  await questionService.list();
  expect(apiClient.get).toHaveBeenCalledWith("/questions", {
    params: { search: undefined, type: undefined, page: 1, limit: 20 },
  });
});

test("getById fetches /questions/:id and returns the question", async () => {
  apiClient.get.mockResolvedValue({ data: { question: { id: 5, prompt: "2+2?" } } });
  const result = await questionService.getById(5);
  expect(apiClient.get).toHaveBeenCalledWith("/questions/5");
  expect(result).toEqual({ id: 5, prompt: "2+2?" });
});

test("create posts to /questions and returns the created question", async () => {
  apiClient.post.mockResolvedValue({ data: { question: { id: 6 } } });
  const body = {
    prompt: "2+2?",
    type: "mcq",
    content: { options: ["3", "4"], correctOptionIndex: 1 },
  };
  const result = await questionService.create(body);
  expect(apiClient.post).toHaveBeenCalledWith("/questions", body);
  expect(result).toEqual({ id: 6 });
});

test("update patches /questions/:id and returns the updated question", async () => {
  apiClient.patch.mockResolvedValue({ data: { question: { id: 6, prompt: "New" } } });
  const result = await questionService.update(6, { prompt: "New" });
  expect(apiClient.patch).toHaveBeenCalledWith("/questions/6", {
    prompt: "New",
    type: undefined,
    content: undefined,
  });
  expect(result).toEqual({ id: 6, prompt: "New" });
});

test("remove deletes /questions/:id", async () => {
  apiClient.delete.mockResolvedValue({});
  await questionService.remove(6);
  expect(apiClient.delete).toHaveBeenCalledWith("/questions/6");
});
