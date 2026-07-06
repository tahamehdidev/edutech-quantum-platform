import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card.jsx";

test("renders its children", () => {
  render(<Card>Card content</Card>);
  expect(screen.getByText("Card content")).toBeInTheDocument();
});

test("merges a passed className with the base class", () => {
  render(<Card className="extra">Content</Card>);
  const el = screen.getByText("Content");
  expect(el.className).toContain("card");
  expect(el.className).toContain("extra");
});
