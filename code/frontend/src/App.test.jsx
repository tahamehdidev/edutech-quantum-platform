import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.jsx";

// LandingPage now renders a real hero (Frontend Milestone 5), including LandingHeroVisual's
// BlochSphereScene -- same jsdom ResizeObserver/WebGL gap as everywhere else that widget is used.
vi.mock("./components/widgets/BlochSphereScene.jsx", () => ({
  BlochSphereScene: () => <div data-testid="hero-scene" />,
}));

// Trivial smoke test (Frontend Milestone 0's "done when") -- proves the test runner, jsdom
// environment, and route wiring all actually work together, not that routing is fully correct.
// LandingPage.test.jsx covers the real page content; this only proves App wires it up at "/".
test("renders the landing page at the root route", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "See the qubit before you compute with it." })
  ).toBeInTheDocument();
});
