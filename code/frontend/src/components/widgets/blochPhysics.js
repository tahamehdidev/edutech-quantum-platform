// Pure quantum-state math for the Bloch sphere widget -- no React, no three.js, so it's testable
// without a WebGL context and reusable across every mode. A single qubit's state is represented
// two ways depending on what the caller needs: (theta, phi) spherical angles (what the widget
// renders and what gate palettes/sliders manipulate), or a statevector { alpha, beta } of complex
// coefficients (what gate matrices actually operate on). Global phase is fixed throughout so
// alpha is always real and non-negative -- exactly the "global phase isn't measurable, isn't
// shown" scope note from 08-quantum-machine-learning-course.md's own Bloch sphere lesson.

function complexAdd(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

function complexMultiply(a, b) {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function complexScale(a, scalar) {
  return { re: a.re * scalar, im: a.im * scalar };
}

function complexMagnitude(a) {
  return Math.hypot(a.re, a.im);
}

function complexPhase(a) {
  return Math.atan2(a.im, a.re);
}

function complexFromPolar(magnitude, phase) {
  return { re: magnitude * Math.cos(phase), im: magnitude * Math.sin(phase) };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Keeps an angle in [0, 2*PI) -- purely cosmetic (so phi doesn't drift into confusing negative or
// multi-turn values across repeated gate applications), never changes what point it represents.
function normalizeAngle(angleRadians) {
  const twoPi = 2 * Math.PI;
  return ((angleRadians % twoPi) + twoPi) % twoPi;
}

export function startStateToAngles(startState) {
  if (Array.isArray(startState)) {
    const [theta, phi] = startState;
    return { theta, phi: normalizeAngle(phi) };
  }
  switch (startState) {
    case "1":
      return { theta: Math.PI, phi: 0 };
    case "+":
      return { theta: Math.PI / 2, phi: 0 };
    case "-":
      return { theta: Math.PI / 2, phi: Math.PI };
    case "0":
    default:
      return { theta: 0, phi: 0 };
  }
}

// |psi> = a|0> + b|1>, a = cos(theta/2) (real, non-negative by the fixed-global-phase convention
// above), b = sin(theta/2) * e^(i*phi).
export function anglesToCoefficients(theta, phi) {
  return {
    a: Math.cos(theta / 2),
    bMagnitude: Math.sin(theta / 2),
    bPhaseRadians: normalizeAngle(phi),
  };
}

// Unit vector on the sphere, north pole (theta=0) = |0>, south pole (theta=PI) = |1>. Convention-
// only in this module -- the renderer decides how this maps onto its own 3D axes.
export function anglesToCartesian(theta, phi) {
  return {
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.sin(theta) * Math.sin(phi),
    z: Math.cos(theta),
  };
}

export function probabilityOf0(theta) {
  return Math.cos(theta / 2) ** 2;
}

export function probabilityOf1(theta) {
  return Math.sin(theta / 2) ** 2;
}

function anglesToStatevector(theta, phi) {
  return {
    alpha: { re: Math.cos(theta / 2), im: 0 },
    beta: complexFromPolar(Math.sin(theta / 2), phi),
  };
}

// Re-fixes global phase after a gate multiplies the statevector by an arbitrary complex matrix --
// without this, alpha could come out complex/negative, and (theta, phi) wouldn't round-trip.
function statevectorToAngles({ alpha, beta }) {
  const alphaMagnitude = complexMagnitude(alpha);
  const betaMagnitude = complexMagnitude(beta);
  // Degenerate at the poles (alpha or beta is exactly 0) -- phase is undefined there anyway, since
  // every phi represents the same point when theta is 0 or PI. 0 is as good a choice as any.
  const phaseCorrection = alphaMagnitude < 1e-9 ? 0 : -complexPhase(alpha);
  const correctedBeta = complexMultiply(beta, complexFromPolar(1, phaseCorrection));
  const theta = 2 * Math.acos(clamp(alphaMagnitude, 0, 1));
  const phi = betaMagnitude < 1e-9 ? 0 : normalizeAngle(complexPhase(correctedBeta));
  return { theta, phi };
}

// Single-qubit gate matrices, applied as newState = M * [alpha, beta]. Only the gates actually
// named in the course docs (08-quantum-machine-learning-course.md's availableGates examples) --
// two-qubit gates like CNOT are out of scope for a single-arrow widget.
const GATES = {
  X: (alpha, beta) => ({ alpha: beta, beta: alpha }),
  Z: (alpha, beta) => ({ alpha, beta: complexScale(beta, -1) }),
  H: (alpha, beta) => {
    const invSqrt2 = 1 / Math.SQRT2;
    return {
      alpha: complexScale(complexAdd(alpha, beta), invSqrt2),
      beta: complexScale(complexAdd(alpha, complexScale(beta, -1)), invSqrt2),
    };
  },
  // Rx(angle) = [[cos(angle/2), -i*sin(angle/2)], [-i*sin(angle/2), cos(angle/2)]]
  Rx: (alpha, beta, angleRadians) => {
    const cos = { re: Math.cos(angleRadians / 2), im: 0 };
    const negativeISin = { re: 0, im: -Math.sin(angleRadians / 2) };
    return {
      alpha: complexAdd(complexMultiply(cos, alpha), complexMultiply(negativeISin, beta)),
      beta: complexAdd(complexMultiply(negativeISin, alpha), complexMultiply(cos, beta)),
    };
  },
};

export const AVAILABLE_GATE_NAMES = Object.keys(GATES);

// angleRadians is only used by parameterized gates (currently just Rx) -- ignored otherwise.
export function applyGate(gateName, theta, phi, angleRadians) {
  const { alpha, beta } = anglesToStatevector(theta, phi);
  const { alpha: newAlpha, beta: newBeta } = GATES[gateName](alpha, beta, angleRadians);
  return statevectorToAngles({ alpha: newAlpha, beta: newBeta });
}

// randomValue is injected (rather than this function calling Math.random() itself) so measurement
// collapse is a pure, deterministically-testable function -- the widget supplies Math.random()
// at the one real call site.
export function measurementOutcome(theta, randomValue) {
  return randomValue < probabilityOf0(theta) ? "0" : "1";
}

// T1 relaxation: population in |1> decays as exp(-t/T1) toward |0>, exactly the standard T1
// formula (not just a vague "slow drift") -- P(|1>, t) = exp(-t/T1), so
// P(|0>, t) = 1 - exp(-t/T1) = cos^2(theta(t)/2), solved for theta(t) below. At t=0 this gives
// theta=PI (pure |1>, the documented T1-decay starting point); as t -> infinity, theta -> 0.
export function t1DecayTheta(elapsedMs, t1Ms) {
  // Clamped before the sqrt, not after -- Math.sqrt of a negative number is NaN, and clamping a
  // NaN doesn't recover it (Math.min/max propagate NaN through). elapsedMs is expected to be
  // >= 0, but a timer-precision quirk producing a tiny negative value should degrade to "no
  // decay yet", not NaN.
  const populationOf0 = clamp(1 - Math.exp(-elapsedMs / t1Ms), 0, 1);
  return 2 * Math.acos(Math.sqrt(populationOf0));
}
