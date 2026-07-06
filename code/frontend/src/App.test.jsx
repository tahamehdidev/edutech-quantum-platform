import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.jsx";

// Trivial smoke test (Frontend Milestone 0's "done when") -- proves the test runner, jsdom
// environment, and route wiring all actually work together, not that routing is fully correct.
test("renders the landing page at the root route", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  expect(screen.getByText("Landing")).toBeInTheDocument();
});
