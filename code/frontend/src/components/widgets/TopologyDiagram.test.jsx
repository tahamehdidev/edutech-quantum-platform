import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopologyDiagram } from "./TopologyDiagram.jsx";
import { gridTopologyParams } from "./TopologyDiagram.fixtures.js";

// Buttons' accessible name is "<label>, row R, column C" (screen-reader-only spatial context --
// the visible text stays just the short label). Queried by prefix throughout so tests don't
// hard-code row/column numbers redundantly with the fixture's own x/y values.
function byLabel(label) {
  return new RegExp(`^${label},`);
}

test("renders the caption and one button per qubit", () => {
  render(<TopologyDiagram params={gridTopologyParams} />);

  expect(screen.getByText(gridTopologyParams.caption)).toBeInTheDocument();
  gridTopologyParams.qubits.forEach((qubit) => {
    expect(screen.getByRole("button", { name: byLabel(qubit.label) })).toBeInTheDocument();
  });
});

test("renders each qubit's row/column position in its accessible name", () => {
  render(<TopologyDiagram params={gridTopologyParams} />);
  expect(screen.getByRole("button", { name: "Q0, row 1, column 1" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Q1, row 1, column 2" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Q2, row 2, column 1" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Q3, row 2, column 2" })).toBeInTheDocument();
});

test("prompts for a first selection before anything is clicked", () => {
  render(<TopologyDiagram params={gridTopologyParams} />);
  expect(
    screen.getByText("Click any two qubits to check whether they're directly connected.")
  ).toBeInTheDocument();
});

test("selecting one qubit prompts for a second, and shows it as selected", async () => {
  const user = userEvent.setup();
  render(<TopologyDiagram params={gridTopologyParams} />);

  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));

  expect(
    screen.getByText("Q0 selected -- click a second qubit to check its connection.")
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: byLabel("Q0") })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("clicking the same qubit again deselects it", async () => {
  const user = userEvent.setup();
  render(<TopologyDiagram params={gridTopologyParams} />);

  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));
  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));

  expect(
    screen.getByText("Click any two qubits to check whether they're directly connected.")
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: byLabel("Q0") })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

test("reports a directly-connected pair (Q0-Q1, an edge in the fixture)", async () => {
  const user = userEvent.setup();
  render(<TopologyDiagram params={gridTopologyParams} />);

  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));
  await user.click(screen.getByRole("button", { name: byLabel("Q1") }));

  expect(screen.getByRole("status")).toHaveTextContent("Q0 and Q1 are directly connected.");
});

test("reports a non-connected pair (Q0-Q3, the diagonal, not an edge in the fixture)", async () => {
  const user = userEvent.setup();
  render(<TopologyDiagram params={gridTopologyParams} />);

  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));
  await user.click(screen.getByRole("button", { name: byLabel("Q3") }));

  expect(screen.getByRole("status")).toHaveTextContent("Q0 and Q3 are not directly connected.");
});

test("connectivity check is order-independent", async () => {
  const user = userEvent.setup();
  render(<TopologyDiagram params={gridTopologyParams} />);

  await user.click(screen.getByRole("button", { name: byLabel("Q1") }));
  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));

  expect(screen.getByRole("status")).toHaveTextContent("Q1 and Q0 are directly connected.");
});

test("a third click starts a completely fresh pair rather than extending the old one", async () => {
  const user = userEvent.setup();
  render(<TopologyDiagram params={gridTopologyParams} />);

  await user.click(screen.getByRole("button", { name: byLabel("Q0") }));
  await user.click(screen.getByRole("button", { name: byLabel("Q1") }));
  await user.click(screen.getByRole("button", { name: byLabel("Q2") }));

  expect(
    screen.getByText("Q2 selected -- click a second qubit to check its connection.")
  ).toBeInTheDocument();
});
