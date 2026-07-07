// One params object per mode, matching the real documented lessons that use each
// (08-quantum-machine-learning-course.md's Bloch sphere interaction spec, reused identically by
// the Algorithms and Hardware courses per the spine's shared-visual-language design note).

// Lesson 2.3 -- first introduction, observation-only: drag the arrow anywhere on the surface.
export const freePlacementParams = {
  mode: "free_placement",
  startState: "0",
};

// Lesson 2.4 -- starting at |0>, apply H/X/Z from a palette (Rx included too, since Lesson 4.1
// adds a slider-driven Rx gate to this same mode rather than introducing a new one).
export const gateApplicationParams = {
  mode: "gate_application",
  startState: "0",
  availableGates: ["H", "X", "Z", "Rx"],
};

// Lesson 3.4 -- a bare feature-value slider (0 to 1) rotating the arrow from north toward south,
// no gate palette involved.
export const rotationSliderParams = {
  mode: "rotation_slider",
  startState: "0",
  sliderLabel: "Feature value",
};

// Lesson 2.5 -- starting at |+>, "Measure" collapses to a pole with the matching probability.
export const measurementParams = {
  mode: "measurement",
  startState: "+",
};

// Hardware course Lesson 5.2 -- starts at |1>, drifts toward |0> over a simulated T1 time.
export const t1DecayParams = {
  mode: "t1_decay",
  startState: "1",
  t1Ms: 1500,
};
