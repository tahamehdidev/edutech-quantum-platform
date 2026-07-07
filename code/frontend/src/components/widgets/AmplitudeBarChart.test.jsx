import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmplitudeBarChart } from "./AmplitudeBarChart.jsx";
import { groverDiffusionParams, uniformSuperpositionParams } from "./AmplitudeBarChart.fixtures.js";

test("renders the caption and one bar per amplitude", () => {
  const { container } = render(<AmplitudeBarChart params={groverDiffusionParams} />);

  expect(screen.getByText(groverDiffusionParams.caption)).toBeInTheDocument();
  expect(container.querySelectorAll(".amplitude-bar-chart__bar")).toHaveLength(
    groverDiffusionParams.amplitudes.length
  );
});

test("marks the highlighted bar and carries the (marked) label into the accessible table", () => {
  const { container } = render(<AmplitudeBarChart params={groverDiffusionParams} />);

  expect(container.querySelectorAll(".amplitude-bar-chart__bar--highlighted")).toHaveLength(1);
  expect(screen.getByText(/^011 \(marked\)$/)).toBeInTheDocument();
});

test("provides an accessible data table with the real amplitude values, not just the visual chart", () => {
  render(<AmplitudeBarChart params={groverDiffusionParams} />);

  const table = screen.getByRole("table");
  groverDiffusionParams.amplitudes.forEach((amplitude) => {
    expect(table).toHaveTextContent(amplitude.toFixed(3));
  });
});

test("the visual chart is hidden from assistive tech (the table carries the data instead)", () => {
  const { container } = render(<AmplitudeBarChart params={groverDiffusionParams} />);
  expect(container.querySelector(".amplitude-bar-chart__chart")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
});

test("works with no highlighted index at all", () => {
  const { container } = render(<AmplitudeBarChart params={uniformSuperpositionParams} />);
  expect(container.querySelectorAll(".amplitude-bar-chart__bar--highlighted")).toHaveLength(0);
  expect(container.querySelectorAll(".amplitude-bar-chart__bar")).toHaveLength(8);
});

test("falls back to positional labels when none are provided", () => {
  render(<AmplitudeBarChart params={{ amplitudes: [0.5, -0.5] }} />);
  // Appears in both the visible chart label and the accessible table -- either is proof enough.
  expect(screen.getAllByText("State 0").length).toBeGreaterThan(0);
  expect(screen.getAllByText("State 1").length).toBeGreaterThan(0);
});
