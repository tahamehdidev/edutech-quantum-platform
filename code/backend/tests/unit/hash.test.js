import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, getDummyHash, initDummyHash } from "../../src/utils/hash.js";

test("hashPassword + verifyPassword round-trip correctly", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.ok(await verifyPassword(hash, "correct horse battery staple"));
  assert.ok(!(await verifyPassword(hash, "wrong password")));
});

test("hashPassword produces an argon2id-tagged hash string", async () => {
  const hash = await hashPassword("some-password-1234");
  assert.match(hash, /^\$argon2id\$/);
});

test("getDummyHash throws before initDummyHash has run", async () => {
  // This module's dummy hash is process-wide singleton state, so this only holds true if no
  // other test file in the same process has already called initDummyHash() first. Run in
  // isolation from the integration suite (which does call it via src/index.js's own boot path --
  // but tests import src/app.js directly, never src/index.js, so initDummyHash() is never
  // implicitly called by importing the app).
  assert.throws(() => getDummyHash(), /Dummy hash not initialized/);
});

test("getDummyHash returns a stable value after initDummyHash", async () => {
  await initDummyHash();
  const first = getDummyHash();
  const second = getDummyHash();
  assert.equal(first, second);
  assert.match(first, /^\$argon2id\$/);
});
