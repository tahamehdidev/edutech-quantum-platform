import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LandingPage } from "./LandingPage.jsx";

// LandingHeroVisual's own tests cover its reduced-motion/WebGL-fallback behavior in isolation;
// here it only needs to render without crashing (real WebGL/ResizeObserver aren't in jsdom).
vi.mock("../components/widgets/BlochSphereScene.jsx", () => ({
  BlochSphereScene: () => <div data-testid="hero-scene" />,
}));

function renderLandingPage() {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
}

test("renders the hero heading and subhead", () => {
  renderLandingPage();
  expect(
    screen.getByRole("heading", { level: 1, name: "See the qubit before you compute with it." })
  ).toBeInTheDocument();
  expect(screen.getByText(/Three rigorous courses/)).toBeInTheDocument();
});

test("hero CTAs link to signup and login", () => {
  renderLandingPage();
  expect(screen.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", "/signup");
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
});

test("renders all three courses with their verbatim core questions", () => {
  renderLandingPage();

  expect(screen.getByRole("heading", { name: "Quantum Machine Learning" })).toBeInTheDocument();
  expect(
    screen.getByText(
      'If a quantum computer can hold and transform exponentially more information than a classical bit register, can it learn patterns the way a neural network does — and what does "learning" even mean when the model is a quantum circuit?'
    )
  ).toBeInTheDocument();

  expect(screen.getByRole("heading", { name: "Quantum Algorithms" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "What can a quantum computer actually compute that a classical computer structurally cannot do efficiently — and why does that threaten the cryptography the entire internet currently relies on?"
    )
  ).toBeInTheDocument();

  expect(screen.getByRole("heading", { name: "Quantum Computing Hardware" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "A qubit is a delicate physical thing, not just a mathematical symbol — so what does it actually take, physically, to build, control, and keep one alive long enough to compute anything useful?"
    )
  ).toBeInTheDocument();
});

test("final CTA links to signup", () => {
  renderLandingPage();
  expect(screen.getByRole("link", { name: "Create your account" })).toHaveAttribute(
    "href",
    "/signup"
  );
});
