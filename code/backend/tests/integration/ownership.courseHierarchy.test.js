// Dedicated test file for the course-ownership hierarchy resolvers, per 06-threat-model.md's own
// call-out that these are "worth dedicated tests" -- exercised here as a named unit of risk
// rather than incidentally through each resource's own CRUD test file.
import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/db.js";
import { resetDb, closeTestDb } from "../setup.js";
import { createUserWithToken } from "../helpers/testUsers.js";

let tokenA;
let tokenB;
let adminToken;
let courseA;
let chapterA;
let lessonA;
let screenA;

beforeEach(async () => {
  await resetDb();

  ({ accessToken: tokenA } = await createUserWithToken({ role: "instructor" }));
  ({ accessToken: tokenB } = await createUserWithToken({ role: "instructor" }));
  ({ accessToken: adminToken } = await createUserWithToken({ role: "admin" }));

  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Instructor A's Course" });
  courseA = courseRes.body.course;

  const chapterRes = await request(app)
    .post(`/courses/${courseA.id}/chapters`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Chapter" });
  chapterA = chapterRes.body.chapter;

  const lessonRes = await request(app)
    .post(`/chapters/${chapterA.id}/lessons`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Lesson" });
  lessonA = lessonRes.body.lesson;

  const screenRes = await request(app)
    .post(`/lessons/${lessonA.id}/screens`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ type: "explanation", content: { text: "Hello" } });
  screenA = screenRes.body.screen;
});

after(async () => {
  await pool.end();
  await closeTestDb();
});

test("true ownership succeeds at every depth -- false-negative check", async () => {
  const chapterUpdate = await request(app)
    .patch(`/chapters/${chapterA.id}`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Renamed" });
  assert.equal(chapterUpdate.status, 200);

  const lessonUpdate = await request(app)
    .patch(`/lessons/${lessonA.id}`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Renamed" });
  assert.equal(lessonUpdate.status, 200);

  const screenUpdate = await request(app)
    .patch(`/screens/${screenA.id}`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ content: { text: "Updated" } });
  assert.equal(screenUpdate.status, 200);
});

test("cross-instructor 403 on update routes at every depth", async () => {
  const chapterUpdate = await request(app)
    .patch(`/chapters/${chapterA.id}`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ title: "Hijacked" });
  assert.equal(chapterUpdate.status, 403);

  const lessonUpdate = await request(app)
    .patch(`/lessons/${lessonA.id}`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ title: "Hijacked" });
  assert.equal(lessonUpdate.status, 403);

  const screenUpdate = await request(app)
    .patch(`/screens/${screenA.id}`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ content: { text: "Hijacked" } });
  assert.equal(screenUpdate.status, 403);

  const courseUpdate = await request(app)
    .patch(`/courses/${courseA.id}`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ title: "Hijacked" });
  assert.equal(courseUpdate.status, 403);
});

test("cross-instructor 403 on create-under-parent routes at every depth", async () => {
  // 03-security-architecture.md §3.1's explicit callout: ownership must be checked on the
  // *parent* for creates too, not just updates to existing resources.
  const createChapter = await request(app)
    .post(`/courses/${courseA.id}/chapters`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ title: "Injected chapter" });
  assert.equal(createChapter.status, 403);

  const createLesson = await request(app)
    .post(`/chapters/${chapterA.id}/lessons`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ title: "Injected lesson" });
  assert.equal(createLesson.status, 403);

  const createScreen = await request(app)
    .post(`/lessons/${lessonA.id}/screens`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ type: "explanation", content: { text: "Injected" } });
  assert.equal(createScreen.status, 403);
});

test("cross-instructor 403 on delete routes at every depth", async () => {
  const deleteScreen = await request(app)
    .delete(`/screens/${screenA.id}`)
    .set("Authorization", `Bearer ${tokenB}`);
  assert.equal(deleteScreen.status, 403);

  const deleteLesson = await request(app)
    .delete(`/lessons/${lessonA.id}?confirm=true`)
    .set("Authorization", `Bearer ${tokenB}`);
  assert.equal(deleteLesson.status, 403);

  const deleteChapter = await request(app)
    .delete(`/chapters/${chapterA.id}?confirm=true`)
    .set("Authorization", `Bearer ${tokenB}`);
  assert.equal(deleteChapter.status, 403);

  const deleteCourse = await request(app)
    .delete(`/courses/${courseA.id}?confirm=true`)
    .set("Authorization", `Bearer ${tokenB}`);
  assert.equal(deleteCourse.status, 403);
});

test("cross-instructor 403 on reorder routes at every depth", async () => {
  const reorderChapters = await request(app)
    .patch(`/courses/${courseA.id}/chapters/reorder`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ orderedIds: [chapterA.id] });
  assert.equal(reorderChapters.status, 403);

  const reorderLessons = await request(app)
    .patch(`/chapters/${chapterA.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ orderedIds: [lessonA.id] });
  assert.equal(reorderLessons.status, 403);

  const reorderScreens = await request(app)
    .patch(`/lessons/${lessonA.id}/screens/reorder`)
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ orderedIds: [screenA.id] });
  assert.equal(reorderScreens.status, 403);
});

test("admin bypasses ownership at every depth", async () => {
  const chapterUpdate = await request(app)
    .patch(`/chapters/${chapterA.id}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ title: "Admin edit" });
  assert.equal(chapterUpdate.status, 200);

  const lessonUpdate = await request(app)
    .patch(`/lessons/${lessonA.id}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ title: "Admin edit" });
  assert.equal(lessonUpdate.status, 200);

  const screenUpdate = await request(app)
    .patch(`/screens/${screenA.id}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ content: { text: "Admin edit" } });
  assert.equal(screenUpdate.status, 200);

  const createLesson = await request(app)
    .post(`/chapters/${chapterA.id}/lessons`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ title: "Admin-created lesson" });
  assert.equal(createLesson.status, 201);
});

test("a nonexistent (but well-formed) id resolves to 404, not a crash", async () => {
  const res = await request(app)
    .patch("/chapters/999999")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Doesn't exist" });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, "NOT_FOUND");
});

test("a malformed (non-numeric) id short-circuits to 400 before reaching the resolver", async () => {
  const res = await request(app)
    .patch("/chapters/not-a-number")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Doesn't matter" });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.equal(res.body.error.field, "chapterId");
});
