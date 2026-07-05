import { test } from "node:test";
import assert from "node:assert/strict";
import { isExactSetMatch } from "../../src/utils/exactSetMatch.js";

test("matches when the sets are identical regardless of order", () => {
  assert.equal(isExactSetMatch([1, 2, 3], [3, 1, 2]), true);
});

test("rejects a missing id", () => {
  assert.equal(isExactSetMatch([1, 2, 3], [1, 2]), false);
});

test("rejects an extra id", () => {
  assert.equal(isExactSetMatch([1, 2, 3], [1, 2, 3, 4]), false);
});

test("rejects a submitted id from outside the actual set", () => {
  assert.equal(isExactSetMatch([1, 2, 3], [1, 2, 99]), false);
});

test("rejects a duplicate in the submitted list even if the size happens to match", () => {
  // actual has 3 distinct ids; submitted also has length 3 but only 2 distinct values -- must
  // not pass just because array lengths match.
  assert.equal(isExactSetMatch([1, 2, 3], [1, 1, 2]), false);
});

test("empty sets match each other", () => {
  assert.equal(isExactSetMatch([], []), true);
});
