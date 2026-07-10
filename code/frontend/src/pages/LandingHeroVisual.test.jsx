import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingHeroVisual } from "./LandingHeroVisual.jsx";

vi.mock("../components/widgets/BlochSphereScene.jsx", () => ({
  BlochSphereScene: ({ theta, phi, draggable, onDrag }) => (
    <div
      data-testid="hero-scene"
      data-draggable={draggable}
      data-theta={theta}
      data-phi={phi}
      onClick={() => onDrag({ theta: 1, phi: 2 })}
    />
  ),
}));

const originalMatchMedia = window.matchMedia;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalWebGLRenderingContext = window.WebGLRenderingContext;

function mockReducedMotion(matches) {
  window.matchMedia = () => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

function mockWebglAvailable(available) {
  window.WebGLRenderingContext = available ? function WebGLRenderingContext() {} : undefined;
  HTMLCanvasElement.prototype.getContext = available ? () => ({}) : () => null;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  window.WebGLRenderingContext = originalWebGLRenderingContext;
});

test("renders the live 3D scene, draggable, when WebGL is available", () => {
  mockReducedMotion(false);
  mockWebglAvailable(true);
  render(<LandingHeroVisual />);

  const scene = screen.getByTestId("hero-scene");
  expect(scene).toBeInTheDocument();
  expect(scene).toHaveAttribute("data-draggable", "true");
});

test("still renders the live scene under prefers-reduced-motion (frozen, not swapped out)", () => {
  mockReducedMotion(true);
  mockWebglAvailable(true);
  render(<LandingHeroVisual />);

  expect(screen.getByTestId("hero-scene")).toBeInTheDocument();
});

test("dragging the sphere jumps to the dragged angle and freezes there", () => {
  mockReducedMotion(false);
  mockWebglAvailable(true);
  render(<LandingHeroVisual />);

  const scene = screen.getByTestId("hero-scene");
  fireEvent.click(scene);

  expect(scene).toHaveAttribute("data-theta", "1");
  expect(scene).toHaveAttribute("data-phi", "2");
});

test("reveals the real P(|0>)/P(|1>) readout only after the visitor drags the sphere", () => {
  mockReducedMotion(false);
  mockWebglAvailable(true);
  const { container } = render(<LandingHeroVisual />);

  const readout = container.querySelector(".landing-hero-visual__readout");
  expect(readout).not.toHaveClass("landing-hero-visual__readout--visible");

  fireEvent.click(screen.getByTestId("hero-scene"));

  expect(readout).toHaveClass("landing-hero-visual__readout--visible");
  expect(readout).toHaveTextContent("P(|0⟩) ≈ 77% · P(|1⟩) ≈ 23%");
});

test("falls back to the static SVG illustration when WebGL isn't available at all", () => {
  mockReducedMotion(false);
  mockWebglAvailable(false);
  const { container } = render(<LandingHeroVisual />);

  expect(screen.queryByTestId("hero-scene")).not.toBeInTheDocument();
  expect(container.querySelector("svg.landing-hero-visual__fallback")).toBeInTheDocument();
});
