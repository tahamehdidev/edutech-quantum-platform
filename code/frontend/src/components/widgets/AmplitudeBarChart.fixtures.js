// Real usage from seed_course_algorithms.json (Grover's algorithm, "The Diffusion Operator: Turning
// Phase Into Probability"): "Picture a bar chart of all N amplitudes, all roughly equal in height,
// except one -- the marked one -- which is now negative instead of positive." The seed's own
// params is still {} (03-security-architecture.md's SimulationContentSchema is a deliberate
// placeholder) -- this fixture is the concrete shape this widget expects once that's filled in.
export const groverDiffusionParams = {
  caption: "Amplitudes before the diffusion operator is applied",
  labels: ["000", "001", "010", "011", "100", "101", "110", "111"],
  amplitudes: [0.354, 0.354, 0.354, -0.354, 0.354, 0.354, 0.354, 0.354],
  highlightedIndex: 3,
};

// A second, unmarked fixture -- proves the widget doesn't assume a highlighted bar always exists.
export const uniformSuperpositionParams = {
  caption: "Equal superposition across 3 qubits",
  labels: ["000", "001", "010", "011", "100", "101", "110", "111"],
  amplitudes: new Array(8).fill(0.354),
};
