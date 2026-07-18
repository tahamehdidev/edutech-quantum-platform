import { useState } from "react";
import "./BasisEncoder.css";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

// Read/interact-only visualization (Screen.content.widgetType, not a graded Question.type) --
// same category as TopologyDiagram/AmplitudeBarChart/QuadrantSelector: no useQuestionAttempt, no
// submit, no XP, nothing to "retry." A live demo of the exact mechanism the lesson's own prose
// describes ("the number 6 in binary is 110 -- basis-encode it across 3 qubits and you get the
// state |110⟩") -- letting a learner try other numbers is the point, not a one-shot answer.
//
// params shape (SimulationContentSchema's `params` was an empty placeholder for this widget type
// -- this is the concrete shape it expects): qubitCount is fixed (the lesson is teaching "one
// qubit per bit," not letting the learner change the qubit budget); defaultNumber seeds the
// widget with whatever worked example the surrounding prose just walked through, so it opens
// already showing that case rather than a cold |000...⟩.
export function BasisEncoder({ params }) {
  const { caption, defaultNumber = 0, qubitCount } = params;
  const maxValue = 2 ** qubitCount - 1;
  const [number, setNumber] = useState(clamp(defaultNumber, 0, maxValue));
  const bits = number.toString(2).padStart(qubitCount, "0").split("");

  function handleChange(event) {
    const raw = Number(event.target.value);
    if (!Number.isFinite(raw)) return;
    setNumber(clamp(raw, 0, maxValue));
  }

  return (
    <figure className="basis-encoder">
      {caption && <figcaption className="basis-encoder__caption">{caption}</figcaption>}

      <div className="basis-encoder__control">
        <label className="basis-encoder__label" htmlFor="basis-encoder-number">
          Number to encode
        </label>
        <input
          id="basis-encoder-number"
          className="basis-encoder__input"
          type="number"
          min={0}
          max={maxValue}
          value={number}
          onChange={handleChange}
        />
        <span className="basis-encoder__range-hint">
          0-{maxValue} across {qubitCount} qubits
        </span>
      </div>

      <div
        className="basis-encoder__qubits"
        role="img"
        aria-label={`${qubitCount} qubits encoding the state, ket ${bits.join("")}`}
      >
        {bits.map((bit, index) => (
          <div key={index} className="basis-encoder__qubit">
            <span className="basis-encoder__qubit-label">Q{index}</span>
            <span className="basis-encoder__qubit-value">|{bit}⟩</span>
          </div>
        ))}
      </div>

      <p className="basis-encoder__result" role="status">
        {number} in binary is {bits.join("")} — the basis-encoded state is |{bits.join("")}⟩
      </p>
    </figure>
  );
}
