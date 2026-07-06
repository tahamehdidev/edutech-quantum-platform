// Dedicated test file for the Question edit-access check (creator OR attached-to-an-owned-course
// via either junction path), per 06-threat-model.md's own call-out that this is "worth dedicated
// tests" -- structurally different from course ownership since a Question has no single parent
// to inherit from. Each junction path is tested independently: these are two different queries
// (screen_question vs practice_set_question), and a fix to one could leave the other broken.
import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/db.js";
import { resetDb, closeTestDb } from "../setup.js";
import { createUserWithToken } from "../helpers/testUsers.js";
import { buildCourseHierarchy } from "../helpers/courseHierarchy.js";

const MCQ_BODY = {
  prompt: "Shared question",
  type: "mcq",
  content: { options: ["A", "B"], correctOptionIndex: 0 },
};

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await pool.end();
  await closeTestDb();
});

test("creator path: the creator can edit/delete; a non-creator, non-attached instructor cannot", async () => {
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: strangerToken } = await createUserWithToken({ role: "instructor" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);
  const questionId = createRes.body.question.id;

  const creatorEdit = await request(app)
    .patch(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${creatorToken}`)
    .send({ prompt: "Edited by creator" });
  assert.equal(creatorEdit.status, 200);

  const strangerEdit = await request(app)
    .patch(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${strangerToken}`)
    .send({ prompt: "Hijack attempt" });
  assert.equal(strangerEdit.status, 403);
  assert.equal(strangerEdit.body.error.code, "FORBIDDEN");
});

test("attachment path 1 (ScreenQuestion): a non-creator instructor gains edit access by attaching the question to their own course", async () => {
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: attacherToken } = await createUserWithToken({ role: "instructor" });

  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);
  const questionId = createRes.body.question.id;

  // Instructor B has no relationship to the question yet -- confirm denied first.
  const beforeAttach = await request(app)
    .patch(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ prompt: "Too early" });
  assert.equal(beforeAttach.status, 403);

  // Instructor B attaches it to a screen in *their own* course.
  const { screen } = await buildCourseHierarchy(attacherToken);
  await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ questionId });

  const afterAttach = await request(app)
    .patch(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ prompt: "Edited via ScreenQuestion attachment" });
  assert.equal(afterAttach.status, 200);
});

test("attachment path 2 (PracticeSetQuestion): a non-creator instructor gains edit access via a practice-set attachment -- tested independently of the ScreenQuestion path", async () => {
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: attacherToken } = await createUserWithToken({ role: "instructor" });

  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);
  const questionId = createRes.body.question.id;

  const { lesson } = await buildCourseHierarchy(attacherToken);
  const psRes = await request(app)
    .post(`/lessons/${lesson.id}/practice-sets`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ title: "Attacher's practice set" });
  await request(app)
    .post(`/practice-sets/${psRes.body.practiceSet.id}/questions`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ questionId });

  const afterAttach = await request(app)
    .patch(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ prompt: "Edited via PracticeSetQuestion attachment" });
  assert.equal(afterAttach.status, 200);
});

test("negative case: an instructor with no relationship to the question at all is denied", async () => {
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: unrelatedToken } = await createUserWithToken({ role: "instructor" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);

  const res = await request(app)
    .delete(`/questions/${createRes.body.question.id}`)
    .set("Authorization", `Bearer ${unrelatedToken}`);
  assert.equal(res.status, 403);
});

test("admin bypasses edit-access entirely", async () => {
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: adminToken } = await createUserWithToken({ role: "admin" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);

  const res = await request(app)
    .patch(`/questions/${createRes.body.question.id}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ prompt: "Admin edit" });
  assert.equal(res.status, 200);
});

test("shared-edit consequence: an edit by an attached (non-creator) instructor is visible to the creator's own course rendering", async () => {
  // Documents the accepted shared-mutable-resource tradeoff (06-threat-model.md, Instructor
  // actor, Tampering) -- proves it's actually implemented as designed (same row, shared by
  // reference), not accidentally forked into a per-instructor copy on edit.
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: attacherToken } = await createUserWithToken({ role: "instructor" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);
  const questionId = createRes.body.question.id;

  const { screen } = await buildCourseHierarchy(attacherToken);
  await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ questionId });

  await request(app)
    .patch(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ prompt: "Changed by the attaching instructor" });

  const creatorsView = await request(app)
    .get(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${creatorToken}`);
  assert.equal(creatorsView.body.question.prompt, "Changed by the attaching instructor");
});

test("cascade deletion with no pre-check or warning: deleting a shared question removes it from every attached course silently", async () => {
  const { accessToken: creatorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: attacherToken } = await createUserWithToken({ role: "instructor" });
  const createRes = await request(app)
    .post("/questions")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send(MCQ_BODY);
  const questionId = createRes.body.question.id;

  const { screen } = await buildCourseHierarchy(attacherToken);
  await request(app)
    .post(`/screens/${screen.id}/questions`)
    .set("Authorization", `Bearer ${attacherToken}`)
    .send({ questionId });

  // The attaching instructor's edit access (via the attachment) is sufficient to delete the
  // question entirely -- including out from under the creator -- with no confirmation step.
  const deleteRes = await request(app)
    .delete(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${attacherToken}`);
  assert.equal(deleteRes.status, 200);

  const getRes = await request(app)
    .get(`/questions/${questionId}`)
    .set("Authorization", `Bearer ${creatorToken}`);
  assert.equal(getRes.status, 404);
});
