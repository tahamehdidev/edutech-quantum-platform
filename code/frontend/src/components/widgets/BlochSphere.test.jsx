import { test, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlochSphere } from "./BlochSphere.jsx";
import {
  freePlacementParams,
  gateApplicationParams,
  rotationSliderParams,
  measurementParams,
  t1DecayParams,
} from "./BlochSphere.fixtures.js";

// The actual WebGL 3D rendering is its own module (BlochSphereScene.jsx) specifically so it can
// be mocked here -- jsdom has neither a ResizeObserver nor a WebGL context (confirmed missing,
// not partially stubbed, via a smoke test against the real Canvas), so it's unrenderable in this
// environment, the same category of gap as Milestone 2's <dialog> polyfill. The mock exposes
// onDrag directly so free_placement's wiring (drag callback -> state update -> readout) stays
// testable even though the real pointer-on-3D-mesh interaction that would trigger it in a real
// browser cannot be simulated here.
vi.mock("./BlochSphereScene.jsx", () => ({
  BlochSphereScene: ({ theta, phi, draggable, onDrag }) => (
    <div
      data-testid="bloch-sphere-scene"
      data-theta={theta}
      data-phi={phi}
      data-draggable={draggable}
      onClick={() => draggable && onDrag({ theta: Math.PI / 2, phi: 0 })}
    />
  ),
}));

// jsdom's requestAnimationFrame polyfill runs roughly an order of magnitude slower than a real
// browser's (confirmed via a standalone timing check, not assumed) -- every assertion waiting on
// an in-flight animation to actually finish needs a generous real-time budget accordingly, or it
// times out despite the animation itself working correctly. Both the waitFor's own budget and the
// enclosing test's overall timeout (vitest's 5s default) need raising -- the latter via test()'s
// own timeout argument at each call site below, or the test aborts before waitFor's 10s is up.
const ANIMATION_WAIT_OPTIONS = { timeout: 10_000 };
const ANIMATION_TEST_TIMEOUT_MS = 15_000;

test("free_placement: renders the scene as draggable, and dragging updates the readout", async () => {
  const user = userEvent.setup();
  render(<BlochSphere params={freePlacementParams} />);

  expect(screen.getByTestId("bloch-sphere-scene")).toHaveAttribute("data-draggable", "true");
  expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 100%");

  await user.click(screen.getByTestId("bloch-sphere-scene")); // mock's onDrag -> equator
  expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 50%");
});

test("gate_application: renders a button per non-Rx gate, plus an Rx slider+button, plus Reset", () => {
  render(<BlochSphere params={gateApplicationParams} />);

  expect(screen.getByRole("button", { name: "H" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "X" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Z" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Apply Rx" })).toBeInTheDocument();
  expect(screen.getByRole("slider")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
});

test(
  "gate_application: applying X moves |0> to |1> (P(|0>) 100% -> 0%)",
  async () => {
    const user = userEvent.setup();
    render(<BlochSphere params={gateApplicationParams} />);

    expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 100%");
    await user.click(screen.getByRole("button", { name: "X" }));
    await waitFor(
      () => expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 0%"),
      ANIMATION_WAIT_OPTIONS
    );
  },
  ANIMATION_TEST_TIMEOUT_MS
);

test(
  "gate_application: applying H creates an equal superposition (P(|0>) -> 50%)",
  async () => {
    const user = userEvent.setup();
    render(<BlochSphere params={gateApplicationParams} />);

    await user.click(screen.getByRole("button", { name: "H" }));
    await waitFor(
      () => expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 50%"),
      ANIMATION_WAIT_OPTIONS
    );
  },
  ANIMATION_TEST_TIMEOUT_MS
);

test(
  "gate_application: Reset returns to the documented start state after a gate was applied",
  async () => {
    const user = userEvent.setup();
    render(<BlochSphere params={gateApplicationParams} />);

    await user.click(screen.getByRole("button", { name: "X" }));
    await waitFor(
      () => expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 0%"),
      ANIMATION_WAIT_OPTIONS
    );

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(
      () => expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 100%"),
      ANIMATION_WAIT_OPTIONS
    );
  },
  ANIMATION_TEST_TIMEOUT_MS
);

test("gate_application: gate buttons are disabled while an animation is in flight", async () => {
  const user = userEvent.setup();
  render(<BlochSphere params={gateApplicationParams} />);

  await user.click(screen.getByRole("button", { name: "X" }));
  expect(screen.getByRole("button", { name: "X" })).toBeDisabled();
});

test("rotation_slider: renders a single slider with the params' label, driving theta directly", () => {
  render(<BlochSphere params={rotationSliderParams} />);

  expect(screen.getByText(/Feature value/)).toBeInTheDocument();
  const slider = screen.getByRole("slider");

  expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 100%");
  fireEvent.change(slider, { target: { value: "1" } });
  expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 0%");
});

test(
  "measurement: Measure collapses to a pole and reports the outcome; Reset clears it",
  async () => {
    const user = userEvent.setup();
    render(<BlochSphere params={measurementParams} />);

    await user.click(screen.getByRole("button", { name: "Measure" }));
    expect(screen.getByText(/^Measured \|(0|1)⟩$/)).toBeInTheDocument();

    // The collapse snap is still animating (isAnimating) for a moment after the click -- Reset is
    // disabled until it finishes, same as every other mode's controls during an in-flight
    // animation.
    await waitFor(
      () => expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled(),
      ANIMATION_WAIT_OPTIONS
    );
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(screen.queryByText(/^Measured/)).not.toBeInTheDocument());
  },
  ANIMATION_TEST_TIMEOUT_MS
);

test(
  "t1_decay: Start Decay begins at |1> and the readout moves away from P(|0>)=0% over time",
  async () => {
    const user = userEvent.setup();
    render(<BlochSphere params={t1DecayParams} />);

    expect(screen.getByRole("status")).toHaveTextContent("P(|0⟩) = 0%");
    await user.click(screen.getByRole("button", { name: "Start Decay" }));

    await waitFor(
      () => expect(screen.getByRole("status")).not.toHaveTextContent("P(|0⟩) = 0%"),
      ANIMATION_WAIT_OPTIONS
    );
  },
  ANIMATION_TEST_TIMEOUT_MS
);
