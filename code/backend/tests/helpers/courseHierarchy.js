import request from "supertest";
import { app } from "../../src/app.js";

// Builds a full Course -> Chapter -> Lesson -> Screen tree via the real HTTP routes (not direct
// repository calls) so every test using this helper also exercises the ownership/validation
// chain those creates go through -- used by Milestone 3+ tests that need a ready-made hierarchy
// to attach questions/practice sets to, without repeating this boilerplate per test.
export async function buildCourseHierarchy(accessToken, overrides = {}) {
  const courseRes = await request(app)
    .post("/courses")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: overrides.courseTitle ?? "Test Course" });
  const course = courseRes.body.course;

  const chapterRes = await request(app)
    .post(`/courses/${course.id}/chapters`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: overrides.chapterTitle ?? "Test Chapter" });
  const chapter = chapterRes.body.chapter;

  const lessonRes = await request(app)
    .post(`/chapters/${chapter.id}/lessons`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ title: overrides.lessonTitle ?? "Test Lesson" });
  const lesson = lessonRes.body.lesson;

  const screenRes = await request(app)
    .post(`/lessons/${lesson.id}/screens`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ type: "question", content: {} });
  const screen = screenRes.body.screen;

  return { course, chapter, lesson, screen };
}
