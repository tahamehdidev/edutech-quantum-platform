import { test, expect, vi } from "vitest";
import { apiClient } from "./apiClient.js";
import { authService } from "./auth.service.js";

vi.mock("./apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

test("signup posts to /auth/signup and returns the created user", async () => {
  apiClient.post.mockResolvedValue({ data: { user: { id: "u1", role: "learner" } } });
  const result = await authService.signup({
    email: "a@example.com",
    password: "pw123456",
    name: "A",
  });
  expect(apiClient.post).toHaveBeenCalledWith("/auth/signup", {
    email: "a@example.com",
    password: "pw123456",
    name: "A",
  });
  expect(result).toEqual({ id: "u1", role: "learner" });
});

test("login posts to /auth/login and returns { user, accessToken } as-is", async () => {
  const body = { user: { id: "u1" }, accessToken: "token123" };
  apiClient.post.mockResolvedValue({ data: body });
  const result = await authService.login({ email: "a@example.com", password: "pw123456" });
  expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
    email: "a@example.com",
    password: "pw123456",
  });
  expect(result).toEqual(body);
});

test("refresh posts to /auth/refresh with no body and returns just the accessToken", async () => {
  apiClient.post.mockResolvedValue({ data: { accessToken: "new-token" } });
  const result = await authService.refresh();
  expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh");
  expect(result).toBe("new-token");
});

test("logout posts to /auth/logout", async () => {
  apiClient.post.mockResolvedValue({});
  await authService.logout();
  expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
});

test("logoutAll posts to /auth/logout-all", async () => {
  apiClient.post.mockResolvedValue({});
  await authService.logoutAll();
  expect(apiClient.post).toHaveBeenCalledWith("/auth/logout-all");
});
