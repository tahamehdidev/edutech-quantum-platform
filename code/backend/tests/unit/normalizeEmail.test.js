import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail } from "../../src/utils/normalizeEmail.js";

test("trims whitespace and lowercases", () => {
  assert.equal(normalizeEmail("  Attacker@X.com  "), "attacker@x.com");
});

test("is idempotent", () => {
  const once = normalizeEmail("Foo@Bar.com");
  assert.equal(normalizeEmail(once), once);
});
