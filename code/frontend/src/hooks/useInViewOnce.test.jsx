import { test, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "@testing-library/react";
import { useInViewOnce } from "./useInViewOnce.js";

// renderHook's ref stays null forever (nothing ever mounts it to a real DOM node), so this needs
// an actual rendered component -- the ref only attaches, and the effect only observes, once React
// commits a real element to the DOM.
function TestComponent() {
  const [ref, isInView] = useInViewOnce();
  return (
    <div ref={ref} data-testid="target">
      {isInView ? "visible" : "hidden"}
    </div>
  );
}

function mockIntersectionObserver() {
  let capturedCallback = null;
  const disconnect = vi.fn();
  window.IntersectionObserver = class {
    constructor(callback) {
      capturedCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {
      disconnect();
    }
  };
  return {
    triggerIntersecting(isIntersecting) {
      capturedCallback([{ isIntersecting }]);
    },
    disconnect,
  };
}

const originalIntersectionObserver = window.IntersectionObserver;

afterEach(() => {
  window.IntersectionObserver = originalIntersectionObserver;
});

test("starts false and becomes true once the observed element intersects", () => {
  const observer = mockIntersectionObserver();
  render(<TestComponent />);

  expect(screen.getByTestId("target")).toHaveTextContent("hidden");

  act(() => observer.triggerIntersecting(true));
  expect(screen.getByTestId("target")).toHaveTextContent("visible");
});

test("disconnects the observer once intersecting, so it never re-fires on scroll-back", () => {
  const observer = mockIntersectionObserver();
  render(<TestComponent />);

  act(() => observer.triggerIntersecting(true));
  expect(observer.disconnect).toHaveBeenCalledTimes(1);
});

test("does not flip true while isIntersecting is false", () => {
  const observer = mockIntersectionObserver();
  render(<TestComponent />);

  act(() => observer.triggerIntersecting(false));
  expect(screen.getByTestId("target")).toHaveTextContent("hidden");
});
