import { test, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion.js";

function mockMatchMedia(initialMatches) {
  let matches = initialMatches;
  const listeners = new Set();
  window.matchMedia = (query) => ({
    media: query,
    get matches() {
      return matches;
    },
    addEventListener: (_event, listener) => listeners.add(listener),
    removeEventListener: (_event, listener) => listeners.delete(listener),
  });
  return {
    setMatches(nextMatches) {
      matches = nextMatches;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

test("reflects the current prefers-reduced-motion value on mount", () => {
  mockMatchMedia(true);
  const { result } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(true);
});

test("updates when the media query change fires", () => {
  const media = mockMatchMedia(false);
  const { result } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(false);

  act(() => media.setMatches(true));
  expect(result.current).toBe(true);
});
