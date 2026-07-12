import { useState, useRef, useEffect, useMemo } from "react";
import {
  startStateToAngles,
  anglesToCoefficients,
  probabilityOf0,
  applyGate,
  measurementOutcome,
  t1DecayTheta,
} from "./blochPhysics.js";
import { BlochSphereScene } from "./BlochSphereScene.jsx";
import { Button } from "../ui/Button.jsx";
import "./BlochSphere.css";

const GATE_ANIMATION_MS = 600;
const MEASUREMENT_ANIMATION_MS = 350;
const T1_ANIMATION_TOTAL_MS = 6000;
const DEFAULT_T1_MS = 1500;

// Shared by every animation this widget runs -- gate transitions, measurement collapse, and T1
// decay all just need "call onFrame(elapsed) every frame for durationMs, honoring cancellation,
// then call onComplete once." What differs between them is only what onFrame does with elapsed
// (linearly interpolate toward a target vs. evaluate the actual T1 formula), so they share this
// one rAF-loop-plus-cancellation mechanism instead of each reimplementing it.
function runFrameLoop({ durationMs, isCancelled, onFrame, onComplete }) {
  const start = performance.now();
  function step(now) {
    if (isCancelled()) return;
    const elapsed = now - start;
    onFrame(Math.min(elapsed, durationMs));
    if (elapsed < durationMs) requestAnimationFrame(step);
    else onComplete?.();
  }
  requestAnimationFrame(step);
}

function formatCoefficients(theta, phi) {
  const { a, bMagnitude, bPhaseRadians } = anglesToCoefficients(theta, phi);
  const bPhaseDegrees = Math.round((bPhaseRadians * 180) / Math.PI);
  return {
    a: a.toFixed(3),
    b: `${bMagnitude.toFixed(3)} e^i${bPhaseDegrees}°`,
  };
}

// Read/interact-only visualization (Frontend Milestone 4, the last of six, deliberately -- by now
// the wrapper/tokens/content-consumption conventions are proven on five simpler widgets, isolating
// 3D rendering as the only new unknown). Same category as AmplitudeBarChart/TopologyDiagram: a
// Screen.content.widgetType simulation widget, not a graded Question.type one -- no
// useQuestionAttempt, no submit, no XP, per every course doc's own description of it as a live
// exploration tool.
//
// params shape -- the mode/startState/availableGates fields are exactly what
// 08-quantum-machine-learning-course.md's own widget interaction spec documents; t1Ms and
// sliderLabel are this widget's own additions for the two modes the docs describe in prose but
// don't give a JSON shape for (03-security-architecture.md's SimulationContentSchema is a
// deliberate placeholder -- extending it per-mode as each mode's shape becomes known, exactly as
// flagged in the project plan, not something to front-load speculatively):
//   mode: "free_placement" | "gate_application" | "rotation_slider" | "measurement" | "t1_decay"
//   startState?: "0" | "1" | "+" | "-" | [theta, phi]   (default "0")
//   availableGates?: string[]   gate_application only -- e.g. ["H","X","Z"] or [..., "Rx"]
//   sliderLabel?: string        rotation_slider only -- what the slider represents (e.g. a feature value)
//   t1Ms?: number               t1_decay only -- the decay time constant
//
// Frontend Milestone 6 non-applicability finding: none of the four before/after-answer-state
// concepts (pre/post attempt state, correct/incorrect indicator, xpAwarded distinction, retry
// behavior) apply to any mode, including `measurement`. That mode does have its own internal
// before/after (unmeasured -> handleMeasure() sets measurementResult, rendered as "Measured |0>"
// or "Measured |1>"), but this is a physics outcome being displayed, not a submitted answer being
// graded -- there is no correct/incorrect verdict (a measurement collapsing to |1> isn't "wrong"),
// no useQuestionAttempt, no submit, no XP. Worth calling out explicitly precisely because it looks
// closest to the graded pattern of the six widgets -- it should not be retrofitted with fake
// correct/incorrect semantics it doesn't have. Out of scope for Milestone 6 by design.
export function BlochSphere({ params }) {
  const { mode, startState = "0", availableGates = [], sliderLabel, t1Ms = DEFAULT_T1_MS } = params;
  const startAngles = useMemo(() => startStateToAngles(startState), [startState]);

  const [angles, setAngles] = useState(startAngles);
  const [isAnimating, setIsAnimating] = useState(false);
  const [measurementResult, setMeasurementResult] = useState(null);
  const [rxAngleDegrees, setRxAngleDegrees] = useState(180);
  const [sliderValue, setSliderValue] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // A plain function (not memoized), like every other handler below -- so it always closes over
  // this render's current `angles` rather than needing a ref or an exhaustive-deps workaround to
  // avoid animating from a stale starting point.
  function runAnimation(to, durationMs, onComplete) {
    const from = angles;
    cancelledRef.current = false;
    setIsAnimating(true);
    runFrameLoop({
      durationMs,
      isCancelled: () => cancelledRef.current,
      onFrame: (elapsed) => {
        const t = elapsed / durationMs;
        setAngles({
          theta: from.theta + (to.theta - from.theta) * t,
          phi: from.phi + (to.phi - from.phi) * t,
        });
      },
      onComplete: () => {
        setIsAnimating(false);
        onComplete?.();
      },
    });
  }

  function handleApplyGate(gateName, gateParamRadians) {
    if (isAnimating) return;
    const target = applyGate(gateName, angles.theta, angles.phi, gateParamRadians);
    runAnimation(target, GATE_ANIMATION_MS);
  }

  function handleReset() {
    if (isAnimating) return;
    setMeasurementResult(null);
    runAnimation(startAngles, GATE_ANIMATION_MS);
  }

  function handleMeasure() {
    if (isAnimating) return;
    const outcome = measurementOutcome(angles.theta, Math.random());
    setMeasurementResult(outcome);
    runAnimation(
      outcome === "0" ? { theta: 0, phi: 0 } : { theta: Math.PI, phi: 0 },
      MEASUREMENT_ANIMATION_MS
    );
  }

  function handleStartDecay() {
    if (isAnimating) return;
    cancelledRef.current = false;
    setIsAnimating(true);
    runFrameLoop({
      durationMs: T1_ANIMATION_TOTAL_MS,
      isCancelled: () => cancelledRef.current,
      onFrame: (elapsed) => setAngles({ theta: t1DecayTheta(elapsed, t1Ms), phi: 0 }),
      onComplete: () => setIsAnimating(false),
    });
  }

  function handleSliderChange(event) {
    const value = Number(event.target.value);
    setSliderValue(value);
    setAngles({ theta: value * Math.PI, phi: 0 });
  }

  const coefficients = formatCoefficients(angles.theta, angles.phi);
  const p0Percent = Math.round(probabilityOf0(angles.theta) * 100);
  const p1Percent = 100 - p0Percent;

  return (
    <div className="bloch-sphere">
      <div className="bloch-sphere__canvas-wrapper">
        <BlochSphereScene
          theta={angles.theta}
          phi={angles.phi}
          arrowColor="#438bff"
          draggable={mode === "free_placement" && !isAnimating}
          onDrag={setAngles}
        />
        <span className="bloch-sphere__pole-label bloch-sphere__pole-label--north">|0⟩</span>
        <span className="bloch-sphere__pole-label bloch-sphere__pole-label--south">|1⟩</span>
        <span className="bloch-sphere__pole-label bloch-sphere__pole-label--plus">|+⟩</span>
        <span className="bloch-sphere__pole-label bloch-sphere__pole-label--minus">|−⟩</span>
      </div>

      <div className="bloch-sphere__readout font-mono" role="status">
        <span>
          |ψ⟩ = {coefficients.a}|0⟩ + {coefficients.b}|1⟩
        </span>
        <span>
          P(|0⟩) = {p0Percent}% &middot; P(|1⟩) = {p1Percent}%
        </span>
      </div>

      {mode === "gate_application" && (
        <div className="bloch-sphere__controls">
          {availableGates
            .filter((gate) => gate !== "Rx")
            .map((gate) => (
              <Button
                key={gate}
                type="button"
                variant="secondary"
                disabled={isAnimating}
                onClick={() => handleApplyGate(gate)}
              >
                {gate}
              </Button>
            ))}
          {availableGates.includes("Rx") && (
            <div className="bloch-sphere__rx-control">
              <label htmlFor="bloch-sphere-rx-angle" className="bloch-sphere__rx-label">
                Rx(θ = {rxAngleDegrees}°)
              </label>
              <input
                id="bloch-sphere-rx-angle"
                type="range"
                min="0"
                max="360"
                value={rxAngleDegrees}
                disabled={isAnimating}
                onChange={(event) => setRxAngleDegrees(Number(event.target.value))}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={isAnimating}
                onClick={() => handleApplyGate("Rx", (rxAngleDegrees * Math.PI) / 180)}
              >
                Apply Rx
              </Button>
            </div>
          )}
          <Button type="button" variant="secondary" disabled={isAnimating} onClick={handleReset}>
            Reset
          </Button>
        </div>
      )}

      {mode === "rotation_slider" && (
        <div className="bloch-sphere__controls">
          <label htmlFor="bloch-sphere-rotation-slider" className="bloch-sphere__rx-label">
            {sliderLabel ?? "Value"}: {sliderValue.toFixed(2)}
          </label>
          <input
            id="bloch-sphere-rotation-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sliderValue}
            onChange={handleSliderChange}
          />
        </div>
      )}

      {mode === "measurement" && (
        <div className="bloch-sphere__controls">
          <Button type="button" disabled={isAnimating} onClick={handleMeasure}>
            Measure
          </Button>
          <Button type="button" variant="secondary" disabled={isAnimating} onClick={handleReset}>
            Reset
          </Button>
          {measurementResult && (
            <p className="bloch-sphere__measurement-result" role="status">
              Measured |{measurementResult}⟩
            </p>
          )}
        </div>
      )}

      {mode === "t1_decay" && (
        <div className="bloch-sphere__controls">
          <Button type="button" disabled={isAnimating} onClick={handleStartDecay}>
            Start Decay
          </Button>
          <Button type="button" variant="secondary" disabled={isAnimating} onClick={handleReset}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
