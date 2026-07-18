import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { authMiddleware } from "../../src/middleware/auth.middleware.js";

// Standalone app, same pattern as rateLimit.test.js/errorHandler.test.js -- stub handlers only,
// no DB, so this stays a true unit test of the whitelist matching logic itself, not an
// integration test of the real course/chapter/lesson controllers.
function buildApp() {
  const app = express();
  app.use(authMiddleware);
  app.get("/health", (req, res) => res.status(200).json({ ok: true }));
  app.get("/courses", (req, res) => res.status(200).json({ ok: true }));
  app.get("/courses/:courseId", (req, res) => res.status(200).json({ ok: true }));
  app.get("/courses/:courseId/chapters", (req, res) => res.status(200).json({ ok: true }));
  app.get("/chapters/:chapterId/lessons", (req, res) => res.status(200).json({ ok: true }));
  app.get("/lessons/:lessonId/screens", (req, res) => res.status(200).json({ ok: true }));
  app.post("/courses", (req, res) => res.status(201).json({ ok: true }));
  app.use((err, req, res, next) => res.status(err.statusCode ?? 500).json({ error: err.code }));
  return app;
}

test("Phase 5.5 syllabus-preview paths are reachable with no Authorization header", async () => {
  const app = buildApp();
  for (const path of ["/courses", "/courses/9", "/courses/9/chapters", "/chapters/15/lessons"]) {
    const res = await request(app).get(path);
    assert.equal(res.status, 200, `${path} should be public`);
  }
});

test("lesson content (screens) still requires auth -- only the syllabus is public", async () => {
  const res = await request(buildApp()).get("/lessons/33/screens");
  assert.equal(res.status, 401);
});

test("whitelisting is method-specific: POST /courses is not opened up by GET /courses being public", async () => {
  const res = await request(buildApp()).post("/courses");
  assert.equal(res.status, 401);
});

test("the pre-existing GET /health whitelist entry still works (no regression)", async () => {
  const res = await request(buildApp()).get("/health");
  assert.equal(res.status, 200);
});
