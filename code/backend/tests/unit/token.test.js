import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../src/utils/token.js";

test("signAccessToken embeds sub/role/email and stringifies jti", () => {
  const token = signAccessToken({ userId: "uuid-1", role: "learner", email: "a@b.com", jti: 42 });
  const decoded = jwt.decode(token);
  assert.equal(decoded.sub, "uuid-1");
  assert.equal(decoded.role, "learner");
  assert.equal(decoded.email, "a@b.com");
  assert.equal(decoded.jti, "42");
  assert.equal(typeof decoded.jti, "string");
  assert.ok(decoded.iat);
  assert.ok(decoded.exp);
});

test("verifyAccessToken returns the payload for a validly signed token", () => {
  const token = signAccessToken({ userId: "uuid-1", role: "admin", email: "x@y.com", jti: 1 });
  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, "uuid-1");
  assert.equal(payload.role, "admin");
});

test("verifyAccessToken throws for a token signed with a different secret", () => {
  const forged = jwt.sign({ sub: "uuid-1", role: "admin", jti: "1" }, "wrong-secret", {
    expiresIn: "15m",
  });
  assert.throws(() => verifyAccessToken(forged));
});

test("generateRefreshToken produces distinct, high-entropy values", () => {
  const a = generateRefreshToken();
  const b = generateRefreshToken();
  assert.notEqual(a, b);
  assert.equal(a.length, 64); // 32 bytes, hex-encoded
});

test("hashToken is deterministic and one-way", () => {
  const raw = "some-raw-refresh-token-value";
  assert.equal(hashToken(raw), hashToken(raw));
  assert.notEqual(hashToken(raw), raw);
  assert.equal(hashToken(raw).length, 64); // sha256 hex digest
});
