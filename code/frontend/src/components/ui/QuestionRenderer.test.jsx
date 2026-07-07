import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionRenderer } from "./QuestionRenderer.jsx";
import { mcqQuestion } from "../widgets/Mcq.fixtures.js";
import { numericQuestion } from "../widgets/Numeric.fixtures.js";
import { dragDropQuestion } from "../widgets/DragDrop.fixtures.js";
import { groverDiffusionParams } from "../widgets/AmplitudeBarChart.fixtures.js";
import { gridTopologyParams } from "../widgets/TopologyDiagram.fixtures.js";
import { freePlacementParams } from "../widgets/BlochSphere.fixtures.js";

// BlochSphere's actual WebGL rendering lives in its own module specifically so it can be mocked
// like this (see BlochSphere.test.jsx for the jsdom ResizeObserver/WebGL gap this works around).
vi.mock("../widgets/BlochSphereScene.jsx", () => ({
  BlochSphereScene: () => <div data-testid="bloch-sphere-scene" />,
}));

// Dispatcher only (Frontend Milestone 2) -- registry entries fill in as each widget lands in
// Milestone 4. This test proves the dispatcher's *shape* is correct for whatever doesn't have a
// widget yet, without asserting on widgets that don't exist. quadrant_selector/basis_encoder were
// never part of the six shared widgets (see QuestionRenderer.jsx's own comment), so they stay
// placeholders even now that all six are built.
test.each(["quadrant_selector", "basis_encoder"])(
  'renders a not-yet-implemented placeholder for type "%s"',
  (type) => {
    render(<QuestionRenderer type={type} />);
    expect(screen.getByText(`Widget "${type}" not yet implemented.`)).toBeInTheDocument();
  }
);

test('dispatches type "mcq" to the real Mcq widget', () => {
  render(<QuestionRenderer type="mcq" question={mcqQuestion} onSubmit={vi.fn()} />);
  expect(screen.getByText(mcqQuestion.prompt)).toBeInTheDocument();
});

test('dispatches type "numeric" to the real Numeric widget', () => {
  render(<QuestionRenderer type="numeric" question={numericQuestion} onSubmit={vi.fn()} />);
  expect(screen.getByText(numericQuestion.prompt)).toBeInTheDocument();
});

test('dispatches type "drag_drop" to the real DragDrop widget', () => {
  render(<QuestionRenderer type="drag_drop" question={dragDropQuestion} onSubmit={vi.fn()} />);
  expect(screen.getByText(dragDropQuestion.prompt)).toBeInTheDocument();
});

test('dispatches type "amplitude_bar_chart" to the real AmplitudeBarChart widget', () => {
  render(<QuestionRenderer type="amplitude_bar_chart" params={groverDiffusionParams} />);
  expect(screen.getByText(groverDiffusionParams.caption)).toBeInTheDocument();
});

test('dispatches type "topology_diagram" to the real TopologyDiagram widget', () => {
  render(<QuestionRenderer type="topology_diagram" params={gridTopologyParams} />);
  expect(screen.getByText(gridTopologyParams.caption)).toBeInTheDocument();
});

test('dispatches type "bloch_sphere" to the real BlochSphere widget', () => {
  render(<QuestionRenderer type="bloch_sphere" params={freePlacementParams} />);
  expect(screen.getByTestId("bloch-sphere-scene")).toBeInTheDocument();
});

test("renders the placeholder for an unrecognized type too, rather than throwing", () => {
  render(<QuestionRenderer type="not_a_real_widget" />);
  expect(screen.getByText('Widget "not_a_real_widget" not yet implemented.')).toBeInTheDocument();
});
