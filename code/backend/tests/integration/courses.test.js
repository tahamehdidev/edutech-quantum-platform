import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/db.js";
import { resetDb, closeTestDb } from "../setup.js";
import { createUserWithToken } from "../helpers/testUsers.js";

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await pool.end();
  await closeTestDb();
});

test("POST /courses as instructor creates a course owned by that instructor", async () => {
  const { user: instructor, accessToken } = await createUserWithToken({ role: "instructor" });
  const res = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Quantum Algorithms" });

  assert.equal(res.status, 201);
  assert.equal(res.body.course.title, "Quantum Algorithms");
  assert.equal(res.body.course.created_by_id, instructor.id);
});

test("POST /courses as learner is rejected -- role check", async () => {
  const { accessToken } = await createUserWithToken({ role: "learner" });
  const res = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Should not be created" });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, "FORBIDDEN");
});

test("GET /courses/:courseId returns the course with nested chapters", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Quantum Hardware" });
  const courseId = courseRes.body.course.id;

  await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Chapter 1" });

  const res = await request(app)
    .get(`/courses/${courseId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.course.chapters.length, 1);
  assert.equal(res.body.course.chapters[0].title, "Chapter 1");
});

test("sequential chapter creates get distinct, incrementing order_index values", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const courseId = courseRes.body.course.id;

  const first = await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "First" });
  const second = await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Second" });

  assert.equal(first.body.chapter.order_index, 1);
  assert.equal(second.body.chapter.order_index, 2);
});

test("truly concurrent chapter creates under the same course still get distinct order_index values", async () => {
  // Fires both requests without awaiting the first before starting the second, so they're
  // genuinely in-flight at the same time -- this is the exact race withOrderedInsert's row lock
  // exists to prevent (simplicity-principles review, Milestone 2): without it, two concurrent
  // creates could both read the same "current max" and both compute the same order_index.
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Concurrency Test Course" });
  const courseId = courseRes.body.course.id;

  const [a, b, c] = await Promise.all([
    request(app)
      .post(`/courses/${courseId}/chapters`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "A" }),
    request(app)
      .post(`/courses/${courseId}/chapters`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "B" }),
    request(app)
      .post(`/courses/${courseId}/chapters`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "C" }),
  ]);

  const orderIndexes = [a, b, c].map((res) => res.body.chapter.order_index).sort();
  assert.deepEqual(orderIndexes, [1, 2, 3]);
});

test("reorder with the exact sibling set succeeds", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const courseId = courseRes.body.course.id;
  const chapterA = await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "A" });
  const chapterB = await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "B" });

  const res = await request(app)
    .patch(`/courses/${courseId}/chapters/reorder`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ orderedIds: [chapterB.body.chapter.id, chapterA.body.chapter.id] });
  assert.equal(res.status, 200);

  const listRes = await request(app)
    .get(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(listRes.body.chapters[0].id, chapterB.body.chapter.id);
  assert.equal(listRes.body.chapters[1].id, chapterA.body.chapter.id);
});

test("reorder with a mismatched set is rejected -- 400 REORDER_SET_MISMATCH", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const courseId = courseRes.body.course.id;
  await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "A" });

  const res = await request(app)
    .patch(`/courses/${courseId}/chapters/reorder`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ orderedIds: [999999] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "REORDER_SET_MISMATCH");
});

test("DELETE /courses/:courseId without ?confirm=true is rejected", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const courseId = courseRes.body.course.id;

  const res = await request(app)
    .delete(`/courses/${courseId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.equal(res.body.error.field, "confirm");
});

test("DELETE /courses/:courseId?confirm=true cascades to chapters/lessons/screens", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const courseId = courseRes.body.course.id;
  const chapterRes = await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Chapter" });
  const lessonRes = await request(app)
    .post(`/chapters/${chapterRes.body.chapter.id}/lessons`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Lesson" });
  await request(app)
    .post(`/lessons/${lessonRes.body.lesson.id}/screens`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ type: "explanation", content: { text: "Hello" } });

  const res = await request(app)
    .delete(`/courses/${courseId}?confirm=true`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(res.status, 200);

  const chapterCheck = await pool.query("SELECT * FROM chapter WHERE id = $1", [
    chapterRes.body.chapter.id,
  ]);
  const lessonCheck = await pool.query("SELECT * FROM lesson WHERE id = $1", [
    lessonRes.body.lesson.id,
  ]);
  assert.equal(chapterCheck.rows.length, 0);
  assert.equal(lessonCheck.rows.length, 0);
});

test("an admin course-deletion writes an AuditLog entry with cascade counts", async () => {
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });
  const { user: admin, accessToken: adminToken } = await createUserWithToken({ role: "admin" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ title: "Course" });
  const courseId = courseRes.body.course.id;
  await request(app)
    .post(`/courses/${courseId}/chapters`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ title: "Chapter" });

  await request(app)
    .delete(`/courses/${courseId}?confirm=true`)
    .set("Authorization", `Bearer ${adminToken}`);

  const auditRows = await pool.query(
    "SELECT * FROM audit_log WHERE action = 'course.deleted' AND user_id = $1",
    [admin.id]
  );
  assert.equal(auditRows.rows.length, 1);
  assert.equal(auditRows.rows[0].resource_id, String(courseId));
  assert.equal(auditRows.rows[0].metadata.cascadedChapters, 1);
});

test("DELETE /screens/:screenId needs no ?confirm=true -- leaf node", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const chapterRes = await request(app)
    .post(`/courses/${courseRes.body.course.id}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Chapter" });
  const lessonRes = await request(app)
    .post(`/chapters/${chapterRes.body.chapter.id}/lessons`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Lesson" });
  const screenRes = await request(app)
    .post(`/lessons/${lessonRes.body.lesson.id}/screens`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ type: "explanation", content: { text: "Hello" } });

  const res = await request(app)
    .delete(`/screens/${screenRes.body.screen.id}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(res.status, 200);
});

test("Screen.content is validated against its type's schema -- rejects a malformed simulation payload", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const chapterRes = await request(app)
    .post(`/courses/${courseRes.body.course.id}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Chapter" });
  const lessonRes = await request(app)
    .post(`/chapters/${chapterRes.body.chapter.id}/lessons`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Lesson" });

  const res = await request(app)
    .post(`/lessons/${lessonRes.body.lesson.id}/screens`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ type: "simulation", content: { widgetType: "not_a_real_widget", params: {} } });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("Screen.content accepts a valid simulation payload", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Course" });
  const chapterRes = await request(app)
    .post(`/courses/${courseRes.body.course.id}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Chapter" });
  const lessonRes = await request(app)
    .post(`/chapters/${chapterRes.body.chapter.id}/lessons`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Lesson" });

  const res = await request(app)
    .post(`/lessons/${lessonRes.body.lesson.id}/screens`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      type: "simulation",
      content: { widgetType: "bloch_sphere", params: { mode: "free_placement" } },
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.screen.content.widgetType, "bloch_sphere");
});
