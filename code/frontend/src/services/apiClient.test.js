import { test, expect, beforeEach, vi } from "vitest";
import { apiClient, configureAuth, attachAccessToken, retryOnceAfterRefresh } from "./apiClient.js";

beforeEach(() => {
  // Reset to the "unconfigured" defaults between tests -- configureAuth() mutates module-level
  // state, so a test that configures it must not leak into the next one.
  configureAuth({ getAccessToken: () => null, refreshAccessToken: async () => null });
});

test("attachAccessToken adds a Bearer header when a token is present", () => {
  configureAuth({ getAccessToken: () => "abc123", refreshAccessToken: async () => null });
  const config = attachAccessToken({ headers: {} });
  expect(config.headers.Authorization).toBe("Bearer abc123");
});

test("attachAccessToken adds no Authorization header when there is no token", () => {
  const config = attachAccessToken({ headers: {} });
  expect(config.headers.Authorization).toBeUndefined();
});

test("retryOnceAfterRefresh re-issues the request with a fresh token on a 401", async () => {
  configureAuth({
    getAccessToken: () => "stale-token",
    refreshAccessToken: async () => "fresh-token",
  });
  const requestSpy = vi.spyOn(apiClient, "request").mockResolvedValue({ status: 200, data: "ok" });

  const error = {
    response: { status: 401 },
    config: { url: "/courses", headers: {} },
  };
  const result = await retryOnceAfterRefresh(error);

  expect(error.config._retry).toBe(true);
  expect(error.config.headers.Authorization).toBe("Bearer fresh-token");
  expect(requestSpy).toHaveBeenCalledWith(error.config);
  expect(result).toEqual({ status: 200, data: "ok" });

  requestSpy.mockRestore();
});

test("retryOnceAfterRefresh does not retry a second time (rejects if _retry is already set)", async () => {
  const error = {
    response: { status: 401 },
    config: { url: "/courses", headers: {}, _retry: true },
  };
  await expect(retryOnceAfterRefresh(error)).rejects.toBe(error);
});

test("retryOnceAfterRefresh does not attempt to refresh when the failing call was /auth/refresh itself", async () => {
  const error = {
    response: { status: 401 },
    config: { url: "/auth/refresh", headers: {} },
  };
  await expect(retryOnceAfterRefresh(error)).rejects.toBe(error);
});

test("retryOnceAfterRefresh rejects immediately for non-401 errors", async () => {
  const error = {
    response: { status: 500 },
    config: { url: "/courses", headers: {} },
  };
  await expect(retryOnceAfterRefresh(error)).rejects.toBe(error);
});
