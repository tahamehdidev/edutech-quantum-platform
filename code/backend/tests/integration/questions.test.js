import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/db.js";
import { resetDb, closeTestDb } from "../setup.js";
import { createUserWithToken } from "../helpers/testUsers.js";
import { buildCourseHierarchy } from "../helpers/courseHierarchy.js";

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await pool.end();
  await closeTestDb();
});

const MCQ_BODY = {
  prompt: "What does Grover's algorithm find?",
  type: "mcq",
  content: { options: ["A", "B", "C", "D"], correctOptionIndex: 2 },
};

test("POST /questions creates an unattached question owned by the caller", async () => {
  const { user: instructor, accessToken } = await createUserWithToken({ role: "instructor" });
  const res = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(MCQ_BODY);

  assert.equal(res.status, 201);
  assert.equal(res.body.question.prompt, MCQ_BODY.prompt);
  assert.equal(res.body.question.createdById, instructor.id);
  assert.equal(res.body.question.content.correctOptionIndex, 2); // creator sees full content
});

test("POST /questions rejects malformed mcq content -- fewer than 2 options", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const res = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      prompt: "Bad question",
      type: "mcq",
      content: { options: ["only one"], correctOptionIndex: 0 },
    });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("GET /questions/:id strips answer/scoring fields for a learner but not for an instructor", async () => {
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(MCQ_BODY);
  const questionId = createRes.body.question.id;

  const { accessToken: learnerToken } = await createUserWithToken({ role: "learner" });
  const learnerRes = await request(app)
    .get(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${learnerToken}`);
  assert.equal(learnerRes.status, 200);
  assert.deepEqual(learnerRes.body.question.content.options, MCQ_BODY.content.options);
  assert.equal(learnerRes.body.question.content.correctOptionIndex, undefined);

  const instructorRes = await request(app)
    .get(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${instructorToken}`);
  assert.equal(instructorRes.body.question.content.correctOptionIndex, 2);
});

test("GET /questions list also strips answer fields for a learner caller", async () => {
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });
  await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(MCQ_BODY);

  const { accessToken: learnerToken } = await createUserWithToken({ role: "learner" });
  const res = await request(app).get("/questions").set("Authorization", `Bearer ${learnerToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.questions.length >= 1);
  for (const q of res.body.questions) {
    assert.equal(q.content.correctOptionIndex, undefined);
  }
});

test("numeric questions reveal nothing in content to a learner caller", async () => {
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({
      prompt: "How many qubits?",
      type: "numeric",
      content: { correctValue: 1000000, tolerance: 100 },
    });

  const { accessToken: learnerToken } = await createUserWithToken({ role: "learner" });
  const res = await request(app)
    .get(`/questions/${createRes.body.question.id}`)
    .set("Authorization", `Bearer ${learnerToken}`);
  assert.deepEqual(res.body.question.content, {});
});

test("POST /screens/:id/questions attaches a question; re-attaching the same pair returns 409", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const { screen } = await buildCourseHierarchy(accessToken);
  const questionRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(MCQ_BODY);
  const questionId = questionRes.body.question.id;

  const attachRes = await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId });
  assert.equal(attachRes.status, 201);

  const reattachRes = await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId });
  assert.equal(reattachRes.status, 409);
  assert.equal(reattachRes.body.error.code, "DUPLICATE_RESOURCE");
});

test("GET /lessons/:id/screens embeds the attached question, shaped per caller role", async () => {
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });
  const { lesson, screen } = await buildCourseHierarchy(instructorToken);
  const questionRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(MCQ_BODY);
  await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ questionId: questionRes.body.question.id });

  const { accessToken: learnerToken } = await createUserWithToken({ role: "learner" });
  const res = await request(app)
    .get(`/lessons/${lesson.id}/screens`)
    .set("Authorization", `Bearer ${learnerToken}`);
  assert.equal(res.status, 200);
  const questionScreen = res.body.screens.find((s) => s.id === screen.id);
  assert.equal(questionScreen.questions.length, 1);
  assert.equal(questionScreen.questions[0].content.correctOptionIndex, undefined);
});

test("DELETE /screens/:id/questions/:questionId detaches; detaching an unattached pair is 404", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const { screen } = await buildCourseHierarchy(accessToken);
  const questionRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(MCQ_BODY);
  const questionId = questionRes.body.question.id;
  await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId });

  const detachRes = await request(app)
    .delete(`/screens/${screen.id}/questions/${questionId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(detachRes.status, 200);

  const secondDetachRes = await request(app)
    .delete(`/screens/${screen.id}/questions/${questionId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(secondDetachRes.status, 404);
});

test("PracticeSet: create, attach two questions with ordering, reorder, and embed ordered questions on GET", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const { lesson } = await buildCourseHierarchy(accessToken);

  const psRes = await request(app)
    .post(`/lessons/${lesson.id}/practice-sets`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Practice Set 1" });
  const practiceSetId = psRes.body.practiceSet.id;

  const q1 = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ ...MCQ_BODY, prompt: "Q1" });
  const q2 = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ ...MCQ_BODY, prompt: "Q2" });

  await request(app)
    .post(`/practice-sets/${practiceSetId}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId: q1.body.question.id });
  await request(app)
    .post(`/practice-sets/${practiceSetId}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId: q2.body.question.id });

  const getRes = await request(app)
    .get(`/practice-sets/${practiceSetId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(getRes.body.practiceSet.questions.length, 2);
  assert.equal(getRes.body.practiceSet.questions[0].id, q1.body.question.id);
  assert.equal(getRes.body.practiceSet.questions[1].id, q2.body.question.id);

  const reorderRes = await request(app)
    .patch(`/practice-sets/${practiceSetId}/questions/reorder`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ orderedIds: [q2.body.question.id, q1.body.question.id] });
  assert.equal(reorderRes.status, 200);

  const afterReorder = await request(app)
    .get(`/practice-sets/${practiceSetId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(afterReorder.body.practiceSet.questions[0].id, q2.body.question.id);
  assert.equal(afterReorder.body.practiceSet.questions[1].id, q1.body.question.id);
});

test("re-attaching an already-attached question to the same practice set returns 409, and the practice_set row's transaction lock/connection recovers cleanly afterward", async () => {
  // practiceSetQuestion.repository.js's attach() wraps the whole withOrderedInsert() transaction
  // (BEGIN, lock the practice_set row, compute order_index, INSERT) in a try/catch for the
  // duplicate-attach 23505 -- unlike screenQuestion's bare-INSERT version, since practice_set_question
  // has an order_index column screen_question doesn't. This test proves that catching the
  // duplicate mid-transaction doesn't leak the row lock or the pooled client: a *different*
  // question attached right after must still succeed, with the correct next order_index --
  // not just reasoned about, the same way the order_index concurrency fix was verified empirically
  // rather than trusted by inspection alone (simplicity-principles review, Milestone 2).
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const { lesson } = await buildCourseHierarchy(accessToken);
  const psRes = await request(app)
    .post(`/lessons/${lesson.id}/practice-sets`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "Practice Set" });
  const questionRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(MCQ_BODY);

  await request(app)
    .post(`/practice-sets/${psRes.body.practiceSet.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId: questionRes.body.question.id });
  const secondAttempt = await request(app)
    .post(`/practice-sets/${psRes.body.practiceSet.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId: questionRes.body.question.id });
  assert.equal(secondAttempt.status, 409);
  assert.equal(secondAttempt.body.error.code, "DUPLICATE_RESOURCE");

  const otherQuestionRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ ...MCQ_BODY, prompt: "A different question" });
  const attachAfterFailure = await request(app)
    .post(`/practice-sets/${psRes.body.practiceSet.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId: otherQuestionRes.body.question.id });
  assert.equal(attachAfterFailure.status, 201);

  const getRes = await request(app)
    .get(`/practice-sets/${psRes.body.practiceSet.id}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(getRes.body.practiceSet.questions.length, 2);
  assert.equal(getRes.body.practiceSet.questions[1].id, otherQuestionRes.body.question.id);
});

test("DELETE /questions/:id cascades silently, detaching from every screen/practice set it was attached to", async () => {
  const { accessToken } = await createUserWithToken({ role: "instructor" });
  const { lesson, screen } = await buildCourseHierarchy(accessToken);
  const questionRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(MCQ_BODY);
  const questionId = questionRes.body.question.id;

  await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId });
  const psRes = await request(app)
    .post(`/lessons/${lesson.id}/practice-sets`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: "PS" });
  await request(app)
    .post(`/practice-sets/${psRes.body.practiceSet.id}/questions`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ questionId });

  const deleteRes = await request(app)
    .delete(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(deleteRes.status, 200);

  const screenQuestionRows = await pool.query(
    "SELECT * FROM screen_question WHERE question_id = $1",
    [questionId]
  );
  const practiceSetQuestionRows = await pool.query(
    "SELECT * FROM practice_set_question WHERE question_id = $1",
    [questionId]
  );
  assert.equal(screenQuestionRows.rows.length, 0);
  assert.equal(practiceSetQuestionRows.rows.length, 0);
});
