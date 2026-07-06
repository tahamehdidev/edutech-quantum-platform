import { test, expect } from "vitest";
import { parseApiError } from "./parseApiError.js";

test("unwraps the backend's error shape from a real HTTP error response", () => {
  const error = {
    response: {
      data: { error: { code: "VALIDATION_ERROR", message: "Invalid email.", field: "email" } },
    },
  };
  expect(parseApiError(error)).toEqual({
    code: "VALIDATION_ERROR",
    message: "Invalid email.",
    field: "email",
  });
});

test("defaults field to null when the backend omits it", () => {
  const error = {
    response: { data: { error: { code: "UNAUTHENTICATED", message: "Not authenticated." } } },
  };
  expect(parseApiError(error)).toEqual({
    code: "UNAUTHENTICATED",
    message: "Not authenticated.",
    field: null,
  });
});

test("falls back to a network-error shape when there's no response at all", () => {
  const error = { message: "Network Error" };
  expect(parseApiError(error)).toEqual({
    code: "NETWORK_ERROR",
    message: "Could not reach the server. Check your connection.",
    field: null,
  });
});
