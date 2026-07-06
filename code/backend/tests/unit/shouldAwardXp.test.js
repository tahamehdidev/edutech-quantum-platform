import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldAwardXp } from "../../src/services/attempt.service.js";

test("awards XP: correct with no prior correct attempt", () => {
  assert.equal(shouldAwardXp({ isCorrect: true, hasPriorCorrectAttempt: false }), true);
});

test("withholds XP: correct but a prior correct attempt already exists", () => {
  assert.equal(shouldAwardXp({ isCorrect: true, hasPriorCorrectAttempt: true }), false);
});

test("withholds XP: incorrect with no prior correct attempt", () => {
  assert.equal(shouldAwardXp({ isCorrect: false, hasPriorCorrectAttempt: false }), false);
});

test("withholds XP: incorrect even if a prior correct attempt exists", () => {
  assert.equal(shouldAwardXp({ isCorrect: false, hasPriorCorrectAttempt: true }), false);
});
