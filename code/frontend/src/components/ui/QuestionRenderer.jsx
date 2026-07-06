import "./QuestionRenderer.css";

// Dispatcher only (Frontend Milestone 2) -- routes to a widget by Question.type or
// Screen.content.widgetType. The six real widgets are built in Milestone 4; every entry here is
// null until then, and the placeholder below is what renders in the meantime.
const WIDGET_REGISTRY = {
  mcq: null,
  drag_drop: null,
  numeric: null,
  bloch_sphere: null,
  amplitude_bar_chart: null,
  topology_diagram: null,
  quadrant_selector: null,
  basis_encoder: null,
};

export function QuestionRenderer({ type, ...props }) {
  const Widget = WIDGET_REGISTRY[type];

  if (!Widget) {
    return (
      <div className="question-renderer__placeholder">
        Widget &quot;{type}&quot; not yet implemented.
      </div>
    );
  }

  return <Widget {...props} />;
}
