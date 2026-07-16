import { test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import { reportError } from "../../utils/sentry.js";

vi.mock("../../utils/sentry.js", () => ({ reportError: vi.fn() }));

function Bomb() {
  throw new Error("boom");
}

// React logs the error to the console itself (the "above error occurred in" dev warning) in
// addition to this component's own componentDidCatch console.error -- suppressed here so the
// test's own pass/fail output isn't buried under expected noise, restored after each test.
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
afterEach(() => {
  consoleErrorSpy.mockClear();
  vi.clearAllMocks();
});

test("renders children normally when nothing has thrown", () => {
  render(
    <ErrorBoundary>
      <div>Real content</div>
    </ErrorBoundary>
  );
  expect(screen.getByText("Real content")).toBeInTheDocument();
});

test("catches a render-time crash and shows a recovery fallback instead of a blank page", () => {
  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  );

  expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reload the page" })).toBeInTheDocument();
  expect(screen.queryByText("Real content")).not.toBeInTheDocument();
});

test("reports the caught error for tracking", () => {
  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  );

  expect(reportError).toHaveBeenCalledOnce();
  expect(reportError.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(reportError.mock.calls[0][0].message).toBe("boom");
});

test("the reload button calls window.location.reload", async () => {
  const user = userEvent.setup();
  const reloadSpy = vi.fn();
  const originalLocation = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, reload: reloadSpy },
  });

  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>
  );
  await user.click(screen.getByRole("button", { name: "Reload the page" }));

  expect(reloadSpy).toHaveBeenCalledOnce();
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});
