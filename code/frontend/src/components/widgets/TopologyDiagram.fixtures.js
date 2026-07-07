// Matches the documented usage exactly (10-quantum-computing-hardware-course.md, Lesson 3.2):
// "learner sees a small grid of qubits with connection lines, can click any two qubits, and the
// widget indicates whether a direct two-qubit gate is possible between them." The real seed's
// params is still {} (SimulationContentSchema's params is a deliberate placeholder) -- this is
// the concrete shape this widget expects once that's filled in.
//
// A 2x2 grid, perimeter-only connections (no diagonals) -- qubits 0 and 3 (and 1 and 2) are NOT
// directly connected, giving a genuine "not connected" case to demonstrate alongside the
// connected ones, exactly the reading skill the lesson is teaching.
export const gridTopologyParams = {
  caption: "A 2x2 grid of qubits -- click any two to check if they're directly connected",
  qubits: [
    { id: 0, x: 0, y: 0, label: "Q0" },
    { id: 1, x: 1, y: 0, label: "Q1" },
    { id: 2, x: 0, y: 1, label: "Q2" },
    { id: 3, x: 1, y: 1, label: "Q3" },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ],
};
