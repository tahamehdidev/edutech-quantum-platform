import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionRenderer } from "./QuestionRenderer.jsx";

// Dispatcher only (Frontend Milestone 2) -- every registry entry is null until the real widgets
// land in Milestone 4, so every type currently renders the same placeholder. This test proves
// the dispatcher's *shape* is correct without asserting on widgets that don't exist yet.
test.each(["mcq", "drag_drop", "numeric", "bloch_sphere", "amplitude_bar_chart"])(
  'renders a not-yet-implemented placeholder for type "%s"',
  (type) => {
    render(<QuestionRenderer type={type} />);
    expect(screen.getByText(`Widget "${type}" not yet implemented.`)).toBeInTheDocument();
  }
);

test("renders the placeholder for an unrecognized type too, rather than throwing", () => {
  render(<QuestionRenderer type="not_a_real_widget" />);
  expect(screen.getByText('Widget "not_a_real_widget" not yet implemented.')).toBeInTheDocument();
});
