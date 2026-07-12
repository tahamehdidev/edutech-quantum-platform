import "./AmplitudeBarChart.css";

// Read-only visualization (Frontend Milestone 4) -- no interaction state, no useQuestionAttempt,
// no submit. This is a Screen.content.widgetType widget (03-security-architecture.md §5.3's
// SimulationContentSchema), not a Question.type one: it renders whatever params the authored
// content carries, purely illustrative alongside the lesson's explanation text.
//
// params shape (not yet pinned down anywhere in the docs -- SimulationContentSchema's `params` is
// a deliberate z.record(z.unknown()) placeholder -- this is the concrete shape this widget expects):
//   amplitudes: number[]       signed real amplitude per basis state (can be negative)
//   labels?: string[]          basis-state labels; defaults to positional "State N" if omitted
//   highlightedIndex?: number  optionally draws attention to one state (e.g. Grover's "marked" state)
//   caption?: string           short context line shown above the chart
//
// The chart itself is aria-hidden -- a bar chart's visual comparison isn't something a screen
// reader can usefully narrate bar-by-bar, so the real values are carried in a visually-hidden
// table instead, giving screen-reader users the same data via the medium that actually suits them.
//
// Frontend Milestone 6 non-applicability finding: none of the four before/after-answer-state
// concepts (pre/post attempt state, correct/incorrect indicator, xpAwarded distinction, retry
// behavior) apply to this widget. There is no submit, no grading, no attempt -- the chart simply
// renders whatever params the authored content carries, with nothing to answer and no verdict to
// deliver. Out of scope for Milestone 6 by design, not an oversight.
export function AmplitudeBarChart({ params }) {
  const { amplitudes, labels, highlightedIndex, caption } = params;
  const resolvedLabels = labels ?? amplitudes.map((_, index) => `State ${index}`);
  // All-zero amplitudes would otherwise divide by zero -- every bar is 0% height regardless of
  // scale in that case, so any positive divisor works.
  const rawMaxMagnitude = Math.max(0, ...amplitudes.map((amplitude) => Math.abs(amplitude)));
  const maxMagnitude = rawMaxMagnitude === 0 ? 1 : rawMaxMagnitude;

  return (
    <figure className="amplitude-bar-chart">
      {caption && <figcaption className="amplitude-bar-chart__caption">{caption}</figcaption>}

      <div className="amplitude-bar-chart__chart" aria-hidden="true">
        {amplitudes.map((amplitude, index) => {
          const scalePercent = (Math.abs(amplitude) / maxMagnitude) * 100;
          const isHighlighted = index === highlightedIndex;
          return (
            <div key={index} className="amplitude-bar-chart__column">
              <div className="amplitude-bar-chart__zone amplitude-bar-chart__zone--positive">
                {amplitude > 0 && (
                  <div
                    className={
                      isHighlighted
                        ? "amplitude-bar-chart__bar amplitude-bar-chart__bar--highlighted"
                        : "amplitude-bar-chart__bar"
                    }
                    style={{ height: `${scalePercent}%` }}
                  />
                )}
              </div>
              <div className="amplitude-bar-chart__zone amplitude-bar-chart__zone--negative">
                {amplitude < 0 && (
                  <div
                    className={
                      isHighlighted
                        ? "amplitude-bar-chart__bar amplitude-bar-chart__bar--highlighted"
                        : "amplitude-bar-chart__bar"
                    }
                    style={{ height: `${scalePercent}%` }}
                  />
                )}
              </div>
              <span className="amplitude-bar-chart__label font-mono">{resolvedLabels[index]}</span>
            </div>
          );
        })}
      </div>

      <table className="visually-hidden">
        {/* Not repeating `caption` here -- the visible figcaption above already announces it, and
            the chart div's aria-hidden doesn't hide the figcaption itself, so a screen reader
            hits both back to back. Repeating the same sentence in the table's own caption would
            just be heard twice. */}
        <caption>Amplitude values</caption>
        <thead>
          <tr>
            <th scope="col">Basis state</th>
            <th scope="col">Amplitude</th>
          </tr>
        </thead>
        <tbody>
          {amplitudes.map((amplitude, index) => (
            <tr key={index}>
              <th scope="row">
                {resolvedLabels[index]}
                {index === highlightedIndex ? " (marked)" : ""}
              </th>
              <td>{amplitude.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
