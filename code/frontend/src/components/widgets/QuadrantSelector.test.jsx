import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuadrantSelector } from "./QuadrantSelector.jsx";
import { dataProcessingQuadrantParams } from "./QuadrantSelector.fixtures.js";

test("renders the caption, both axis labels, and one button per quadrant", () => {
  render(<QuadrantSelector params={dataProcessingQuadrantParams} />);

  expect(screen.getByText(dataProcessingQuadrantParams.caption)).toBeInTheDocument();
  expect(screen.getByText("Processing device")).toBeInTheDocument();
  expect(screen.getByText("Data")).toBeInTheDocument();
  dataProcessingQuadrantParams.quadrants.forEach((quadrant) => {
    expect(screen.getByRole("button", { name: quadrant.label })).toBeInTheDocument();
  });
});

test("defaults to the highlighted quadrant's description on first paint, not a blank state", () => {
  render(<QuadrantSelector params={dataProcessingQuadrantParams} />);

  const highlighted = dataProcessingQuadrantParams.quadrants.find((q) => q.highlighted);
  expect(screen.getByRole("status")).toHaveTextContent(highlighted.description);
  expect(screen.getByRole("button", { name: highlighted.label })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("clicking a different quadrant updates the description and the pressed state", async () => {
  const user = userEvent.setup();
  render(<QuadrantSelector params={dataProcessingQuadrantParams} />);

  const target = dataProcessingQuadrantParams.quadrants[3];
  await user.click(screen.getByRole("button", { name: target.label }));

  expect(screen.getByRole("status")).toHaveTextContent(target.description);
  expect(screen.getByRole("button", { name: target.label })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  const previouslyHighlighted = dataProcessingQuadrantParams.quadrants.find((q) => q.highlighted);
  expect(screen.getByRole("button", { name: previouslyHighlighted.label })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});
