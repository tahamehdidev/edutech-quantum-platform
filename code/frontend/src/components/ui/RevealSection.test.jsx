import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevealSection } from "./RevealSection.jsx";

test("renders a <section> by default, with children and the base scroll-reveal class", () => {
  const { container } = render(<RevealSection>Content</RevealSection>);
  const el = container.querySelector("section");
  expect(el).toBeInTheDocument();
  expect(el).toHaveClass("scroll-reveal");
  expect(screen.getByText("Content")).toBeInTheDocument();
});

test("the `as` prop renders a different element type (e.g. a plain div for non-landing screens)", () => {
  const { container } = render(<RevealSection as="div">Content</RevealSection>);
  expect(container.querySelector("div.scroll-reveal")).toBeInTheDocument();
  expect(container.querySelector("section")).not.toBeInTheDocument();
});

test("does not have --visible before the IntersectionObserver reports intersection (jsdom's stub never fires automatically)", () => {
  const { container } = render(<RevealSection>Content</RevealSection>);
  expect(container.querySelector(".scroll-reveal--visible")).not.toBeInTheDocument();
});
