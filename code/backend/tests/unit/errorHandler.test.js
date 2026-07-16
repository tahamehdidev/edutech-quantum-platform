import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { ValidationError } from "../../src/errors/index.js";
import { errorHandler } from "../../src/middleware/errorHandler.middleware.js";

// Standalone app, same pattern as rateLimit.test.js -- isolated from the real app.js wiring.
// SENTRY_DSN is never set in the test environment, so errorHandler's reportError() call on the
// unhandled-error branch is a genuine Sentry no-op here, not something this test needs to mock.
function buildApp() {
  const app = express();
  app.get("/typed-error", () => {
    throw new ValidationError("bad input", "email");
  });
  app.get("/unhandled-error", () => {
    throw new Error("a genuine bug");
  });
  app.use(errorHandler);
  return app;
}

test("an AppError subclass returns its own typed code/message/field, not a generic 500", async () => {
  const res = await request(buildApp()).get("/typed-error");
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, {
    error: { code: "VALIDATION_ERROR", message: "bad input", field: "email" },
  });
});

test("a non-AppError is funneled to a generic 500, never leaking the original message", async () => {
  const res = await request(buildApp()).get("/unhandled-error");
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, {
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
});
