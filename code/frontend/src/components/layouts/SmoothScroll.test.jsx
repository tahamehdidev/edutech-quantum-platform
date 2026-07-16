import { test, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SmoothScroll } from "./SmoothScroll.jsx";

const lenisInstances = [];

vi.mock("lenis", () => ({
  default: vi.fn().mockImplementation(() => {
    const instance = {
      raf: vi.fn(),
      destroy: vi.fn(),
      scrollTo: vi.fn(),
    };
    lenisInstances.push(instance);
    return instance;
  }),
}));

function mockMatchMedia(matches) {
  window.matchMedia = (query) => ({
    media: query,
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  lenisInstances.length = 0;
});

test("initializes Lenis when motion is allowed, and destroys it on unmount", () => {
  mockMatchMedia(false);
  const { unmount } = render(<SmoothScroll />);
  expect(lenisInstances).toHaveLength(1);

  unmount();
  expect(lenisInstances[0].destroy).toHaveBeenCalledTimes(1);
});

test("does not initialize Lenis under prefers-reduced-motion", () => {
  mockMatchMedia(true);
  render(<SmoothScroll />);
  expect(lenisInstances).toHaveLength(0);
});

test("routes in-page anchor-link clicks through Lenis's own animated scrollTo", () => {
  mockMatchMedia(false);
  document.body.innerHTML = '<a href="#target">Jump</a><section id="target"></section>';
  render(<SmoothScroll />);

  const link = document.querySelector("a");
  const target = document.getElementById("target");
  const clickEvent = fireEvent.click(link);

  expect(clickEvent).toBe(false); // fireEvent.click returns false when preventDefault was called
  expect(lenisInstances[0].scrollTo).toHaveBeenCalledWith(target);

  document.body.innerHTML = "";
});
