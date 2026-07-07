import { useState } from "react";
import "./TopologyDiagram.css";

const CELL_SIZE = 80;
const NODE_RADIUS = 22;

function isDirectlyConnected(edges, qubitIdA, qubitIdB) {
  return edges.some(
    ([a, b]) => (a === qubitIdA && b === qubitIdB) || (a === qubitIdB && b === qubitIdA)
  );
}

// Read/interact-only visualization (Frontend Milestone 4) -- no useQuestionAttempt, no submit,
// no XP. This is a Screen.content.widgetType widget (03-security-architecture.md §5.3's
// SimulationContentSchema), same category as AmplitudeBarChart, not a graded Question.type one:
// per 10-quantum-computing-hardware-course.md's own description, it's a live inspection tool
// ("click any two qubits, lit green if connected, red if not"), not a one-shot answer.
//
// params shape (SimulationContentSchema's `params` is a deliberate placeholder -- this is the
// concrete shape this widget expects):
//   qubits: { id, x, y, label? }[]   x/y are grid-cell coordinates, not pixels (this widget lays
//                                    them out itself at a fixed cell size -- explicit coordinates
//                                    are the author's job, a real layout engine for arbitrary
//                                    chip topologies is out of scope at this widget's tier)
//   edges: [qubitIdA, qubitIdB][]    undirected pairs; a real physical coupling
//   caption?: string
//
// Nodes are real <button> elements absolutely positioned over a plain container, not interactive
// SVG shapes -- native buttons get correct keyboard/focus/role semantics for free, matching the
// project's "prefer native controls" rule, without needing to reimplement any of that for SVG.
// The connecting lines are drawn in a separate aria-hidden SVG layer purely as a visual aid.
export function TopologyDiagram({ params }) {
  const { qubits, edges, caption } = params;
  const [selectedIds, setSelectedIds] = useState([]);

  const width = (Math.max(...qubits.map((q) => q.x)) + 1) * CELL_SIZE;
  const height = (Math.max(...qubits.map((q) => q.y)) + 1) * CELL_SIZE;

  const isPairComplete = selectedIds.length === 2;
  const connected = isPairComplete && isDirectlyConnected(edges, selectedIds[0], selectedIds[1]);

  function handleNodeClick(qubitId) {
    if (selectedIds.length !== 1) {
      setSelectedIds([qubitId]);
      return;
    }
    if (selectedIds[0] === qubitId) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds([selectedIds[0], qubitId]);
  }

  return (
    <figure className="topology-diagram">
      {caption && <figcaption className="topology-diagram__caption">{caption}</figcaption>}

      <div className="topology-diagram__canvas" style={{ width, height }}>
        <svg className="topology-diagram__edges" width={width} height={height} aria-hidden="true">
          {edges.map(([fromId, toId]) => {
            const from = qubits.find((q) => q.id === fromId);
            const to = qubits.find((q) => q.id === toId);
            const isSelectedEdge =
              isPairComplete &&
              ((selectedIds[0] === fromId && selectedIds[1] === toId) ||
                (selectedIds[0] === toId && selectedIds[1] === fromId));
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={from.x * CELL_SIZE + CELL_SIZE / 2}
                y1={from.y * CELL_SIZE + CELL_SIZE / 2}
                x2={to.x * CELL_SIZE + CELL_SIZE / 2}
                y2={to.y * CELL_SIZE + CELL_SIZE / 2}
                className={
                  isSelectedEdge
                    ? "topology-diagram__edge topology-diagram__edge--highlighted"
                    : "topology-diagram__edge"
                }
              />
            );
          })}
        </svg>

        {qubits.map((qubit) => {
          const isSelected = selectedIds.includes(qubit.id);
          const verdictClass =
            isSelected && isPairComplete ? (connected ? "connected" : "not-connected") : null;
          return (
            <button
              key={qubit.id}
              type="button"
              className={[
                "topology-diagram__node",
                isSelected && !verdictClass && "topology-diagram__node--selected",
                verdictClass && `topology-diagram__node--${verdictClass}`,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                left: qubit.x * CELL_SIZE + CELL_SIZE / 2 - NODE_RADIUS,
                top: qubit.y * CELL_SIZE + CELL_SIZE / 2 - NODE_RADIUS,
                width: NODE_RADIUS * 2,
                height: NODE_RADIUS * 2,
              }}
              onClick={() => handleNodeClick(qubit.id)}
              aria-pressed={isSelected}
              aria-label={`${qubit.label ?? `Q${qubit.id}`}, row ${qubit.y + 1}, column ${qubit.x + 1}`}
            >
              {qubit.label ?? `Q${qubit.id}`}
            </button>
          );
        })}
      </div>

      <p className="topology-diagram__result" role="status">
        {isPairComplete
          ? `${labelFor(qubits, selectedIds[0])} and ${labelFor(qubits, selectedIds[1])} are ${
              connected ? "" : "not "
            }directly connected.`
          : selectedIds.length === 1
            ? `${labelFor(qubits, selectedIds[0])} selected -- click a second qubit to check its connection.`
            : "Click any two qubits to check whether they're directly connected."}
      </p>
    </figure>
  );
}

function labelFor(qubits, qubitId) {
  return qubits.find((q) => q.id === qubitId)?.label ?? `Q${qubitId}`;
}
