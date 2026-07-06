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

test("GET /audit-log is admin-only -- instructor and learner get 403", async () => {
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });
  const { accessToken: learnerToken } = await createUserWithToken({ role: "learner" });

  const instructorRes = await request(app)
    .get("/audit-log")
    .set("Authorization", `Bearer ${instructorToken}`);
  assert.equal(instructorRes.status, 403);

  const learnerRes = await request(app)
    .get("/audit-log")
    .set("Authorization", `Bearer ${learnerToken}`);
  assert.equal(learnerRes.status, 403);
});

test("GET /audit-log as admin lists entries an admin action actually produced, filterable by resourceType/userId/since", async () => {
  const { accessToken: adminToken, user: admin } = await createUserWithToken({ role: "admin" });
  const { accessToken: instructorToken } = await createUserWithToken({ role: "instructor" });

  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send({ title: "To Be Deleted" });
  const courseId = courseRes.body.course.id;

  await request(app)
    .delete(`/courses/${courseId}?confirm=true`)
    .set("Authorization", `Bearer ${adminToken}`);

  const allRes = await request(app).get("/audit-log").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(allRes.status, 200);
  assert.equal(allRes.body.entries.length, 1);
  assert.equal(allRes.body.entries[0].action, "course.deleted");
  assert.equal(allRes.body.pagination.total, 1);

  const byResourceType = await request(app)
    .get("/audit-log?resourceType=Course")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(byResourceType.body.entries.length, 1);

  const byWrongResourceType = await request(app)
    .get("/audit-log?resourceType=Cohort")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(byWrongResourceType.body.entries.length, 0);

  const byUserId = await request(app)
    .get(`/audit-log?userId=${admin.id}`)
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(byUserId.body.entries.length, 1);

  const byFutureSince = await request(app)
    .get("/audit-log?since=2099-01-01")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(byFutureSince.body.entries.length, 0);
});

test("GET /audit-log?userId=<malformed> -> 400", async () => {
  const { accessToken: adminToken } = await createUserWithToken({ role: "admin" });

  const res = await request(app)
    .get("/audit-log?userId=not-a-uuid")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 400);
  assert.equal(res.body.error.field, "userId");
});
