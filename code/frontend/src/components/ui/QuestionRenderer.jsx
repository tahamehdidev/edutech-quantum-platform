import { Mcq } from "../widgets/Mcq.jsx";
import { Numeric } from "../widgets/Numeric.jsx";
import { DragDrop } from "../widgets/DragDrop.jsx";
import { AmplitudeBarChart } from "../widgets/AmplitudeBarChart.jsx";
import { TopologyDiagram } from "../widgets/TopologyDiagram.jsx";
import { BlochSphere } from "../widgets/BlochSphere.jsx";
import "./QuestionRenderer.css";

// Dispatcher only (Frontend Milestone 2) -- routes to a widget by Question.type or
// Screen.content.widgetType. The six real widgets are built in Milestone 4; entries are filled
// in as each one lands, and the placeholder below is what renders for the rest until then.
// quadrant_selector/basis_encoder are two other SimulationContentSchema widgetType values, but
// they were never part of the "six shared widgets" build list -- quadrant_selector explicitly
// reuses Mcq's own card styling rather than being a new widget (per the project plan), and
// basis_encoder has no documented spec anywhere; both stay unbuilt placeholders.
const WIDGET_REGISTRY = {
  mcq: Mcq,
  drag_drop: DragDrop,
  numeric: Numeric,
  bloch_sphere: BlochSphere,
  amplitude_bar_chart: AmplitudeBarChart,
  topology_diagram: TopologyDiagram,
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
