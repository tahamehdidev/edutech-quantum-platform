import { test, expect } from "vitest";
import {
  startStateToAngles,
  anglesToCoefficients,
  anglesToCartesian,
  probabilityOf0,
  probabilityOf1,
  applyGate,
  measurementOutcome,
  t1DecayTheta,
} from "./blochPhysics.js";

test.each([
  ["0", 0, 0],
  ["1", Math.PI, 0],
  ["+", Math.PI / 2, 0],
  ["-", Math.PI / 2, Math.PI],
])(
  'startStateToAngles("%s") resolves to the documented pole/equator angles',
  (startState, theta, phi) => {
    const angles = startStateToAngles(startState);
    expect(angles.theta).toBeCloseTo(theta);
    expect(angles.phi).toBeCloseTo(phi);
  }
);

test("startStateToAngles passes an explicit [theta, phi] pair through", () => {
  const angles = startStateToAngles([1.2, 3.4]);
  expect(angles.theta).toBeCloseTo(1.2);
  expect(angles.phi).toBeCloseTo(3.4);
});

test.each([
  [0, 1, 0], // |0>: a=1, |b|=0
  [Math.PI, 0, 1], // |1>: a=0, |b|=1
  [Math.PI / 2, Math.SQRT1_2, Math.SQRT1_2], // |+>/|->: equal magnitude
])("anglesToCoefficients derives a/|b| correctly for theta=%p", (theta, a, bMagnitude) => {
  const coefficients = anglesToCoefficients(theta, 0);
  expect(coefficients.a).toBeCloseTo(a);
  expect(coefficients.bMagnitude).toBeCloseTo(bMagnitude);
});

test("anglesToCartesian places the north pole (|0>) and south pole (|1>) correctly", () => {
  expect(anglesToCartesian(0, 0)).toEqual({ x: 0, y: 0, z: 1 });
  const south = anglesToCartesian(Math.PI, 0);
  expect(south.z).toBeCloseTo(-1);
});

test("probabilityOf0/probabilityOf1 sum to 1 and match the poles", () => {
  expect(probabilityOf0(0)).toBeCloseTo(1);
  expect(probabilityOf1(0)).toBeCloseTo(0);
  expect(probabilityOf0(Math.PI)).toBeCloseTo(0);
  expect(probabilityOf1(Math.PI)).toBeCloseTo(1);
  expect(probabilityOf0(1.7) + probabilityOf1(1.7)).toBeCloseTo(1);
});

test("X gate flips |0> to |1> and vice versa", () => {
  const toOne = applyGate("X", 0, 0);
  expect(toOne.theta).toBeCloseTo(Math.PI);

  const toZero = applyGate("X", Math.PI, 0);
  expect(toZero.theta).toBeCloseTo(0);
});

test("H gate creates |+> from |0>", () => {
  const result = applyGate("H", 0, 0);
  expect(result.theta).toBeCloseTo(Math.PI / 2);
  expect(result.phi).toBeCloseTo(0);
});

test("Z gate maps |+> to |-> (theta unchanged, phi flips by PI)", () => {
  const result = applyGate("Z", Math.PI / 2, 0);
  expect(result.theta).toBeCloseTo(Math.PI / 2);
  expect(result.phi).toBeCloseTo(Math.PI);
});

test("Rx(PI) applied to |0> is equivalent to X (lands on |1>)", () => {
  const result = applyGate("Rx", 0, 0, Math.PI);
  expect(result.theta).toBeCloseTo(Math.PI);
});

test("Rx(0) is the identity", () => {
  const result = applyGate("Rx", Math.PI / 2, 0.3, 0);
  expect(result.theta).toBeCloseTo(Math.PI / 2);
  expect(result.phi).toBeCloseTo(0.3);
});

test("measurementOutcome is a pure function of theta and the injected random draw", () => {
  // theta=0 -> P(|0>)=1, any draw below 1 must resolve to "0"
  expect(measurementOutcome(0, 0.999)).toBe("0");
  // theta=PI -> P(|0>)~=0 (floating-point near-zero, not exactly 0), so a draw comfortably above
  // that must resolve to "1"
  expect(measurementOutcome(Math.PI, 0.5)).toBe("1");
});

test("t1DecayTheta starts at |1> (south pole) and approaches |0> (north pole) over time", () => {
  expect(t1DecayTheta(0, 1000)).toBeCloseTo(Math.PI);
  const partiallyDecayed = t1DecayTheta(1000, 1000); // one full T1 constant elapsed
  expect(partiallyDecayed).toBeLessThan(Math.PI);
  expect(partiallyDecayed).toBeGreaterThan(0);
  expect(t1DecayTheta(50_000, 1000)).toBeCloseTo(0, 2); // effectively fully decayed
});
