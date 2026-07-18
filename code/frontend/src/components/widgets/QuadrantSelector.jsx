import { Fragment, useState } from "react";
import "./QuadrantSelector.css";

// Read/interact-only visualization (Screen.content.widgetType, not a graded Question.type) --
// same category as TopologyDiagram/AmplitudeBarChart: no useQuestionAttempt, no submit, no XP.
// Per the project plan's own note ("quadrant_selector explicitly reuses Mcq's own card styling
// rather than being a new widget"), the quadrant buttons below deliberately echo Mcq.css's own
// card look (border/radius/hover-accent), just arranged in a 2x2 grid instead of a vertical list.
//
// params shape (SimulationContentSchema's `params` is a deliberate placeholder for this widget
// type -- this is the concrete shape it expects): xAxisLabel/yAxisLabel + xAxisValues/yAxisValues
// (each length 2) label the grid's two axes; quadrants is a length-4 array in row-major reading
// order (yAxisValues[0]+xAxisValues[0], yAxisValues[0]+xAxisValues[1], yAxisValues[1]+
// xAxisValues[0], yAxisValues[1]+xAxisValues[1]), each with its own explicit label/description so
// the widget never has to template axis names together -- fully data-driven, same convention as
// TopologyDiagram's caption or AmplitudeBarChart's labels.
export function QuadrantSelector({ params }) {
  const { caption, xAxisLabel, yAxisLabel, xAxisValues, yAxisValues, quadrants } = params;
  // Defaults to the highlighted quadrant (the course's own documented focus) rather than an empty
  // state -- there's always something meaningful to show on first paint, not just a blank grid.
  const defaultIndex = quadrants.findIndex((quadrant) => quadrant.highlighted);
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);
  const selected = quadrants[selectedIndex];

  return (
    <figure className="quadrant-selector">
      {caption && <figcaption className="quadrant-selector__caption">{caption}</figcaption>}

      <div className="quadrant-selector__layout">
        <span className="quadrant-selector__axis-label quadrant-selector__axis-label--x">
          {xAxisLabel}
        </span>
        <div className="quadrant-selector__row">
          <span className="quadrant-selector__axis-label quadrant-selector__axis-label--y">
            {yAxisLabel}
          </span>
          <div className="quadrant-selector__grid">
            <div className="quadrant-selector__corner" aria-hidden="true" />
            {xAxisValues.map((value) => (
              <div key={value} className="quadrant-selector__header">
                {value}
              </div>
            ))}
            {yAxisValues.map((yValue, row) => (
              <Fragment key={yValue}>
                <div className="quadrant-selector__header">{yValue}</div>
                {xAxisValues.map((_, col) => {
                  const index = row * xAxisValues.length + col;
                  const quadrant = quadrants[index];
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={[
                        "quadrant-selector__cell",
                        isSelected && "quadrant-selector__cell--selected",
                        quadrant.highlighted && "quadrant-selector__cell--highlighted",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedIndex(index)}
                    >
                      {quadrant.label}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* role="status": clicking a quadrant changes this text -- a screen reader user gets the
          same "something just updated" signal a sighted user gets for free from the visual swap. */}
      <p className="quadrant-selector__description" role="status">
        {selected.description}
      </p>
    </figure>
  );
}
