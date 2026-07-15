import { pool } from "../config/db.js";
import { withOrderedInsert } from "../utils/orderedInsert.js";

async function findAllForChapter(chapterId) {
  const result = await pool.query(
    "SELECT * FROM lesson WHERE chapter_id = $1 ORDER BY order_index",
    [chapterId]
  );
  return result.rows;
}

// Joins chapter for course_id -- there is no standalone GET /chapters/:id, and the Lesson Player
// needs its own course_id for "back to course" navigation with no other way to resolve it.
// Also computes next_lesson_id: the next lesson in this same chapter, or -- if this is the
// chapter's last lesson -- the first lesson of the next chapter in the same course, or null if
// this is the last lesson of the course's last chapter. Kept as two simple sequential queries
// rather than one nested-subquery SELECT; lesson counts are small (documented seed max: ~25 per
// course), so there's no real cost to this being straightforward instead of clever.
async function findById(id) {
  const result = await pool.query(
    `SELECT lesson.*, chapter.course_id AS course_id, chapter.order_index AS chapter_order_index
     FROM lesson
     JOIN chapter ON chapter.id = lesson.chapter_id
     WHERE lesson.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;

  const { chapter_order_index: chapterOrderIndex, ...lesson } = row;
  lesson.next_lesson_id = await findNextLessonId({
    chapterId: lesson.chapter_id,
    orderIndex: lesson.order_index,
    courseId: lesson.course_id,
    chapterOrderIndex,
  });
  return lesson;
}

async function findNextLessonId({ chapterId, orderIndex, courseId, chapterOrderIndex }) {
  const sameChapterResult = await pool.query(
    `SELECT id FROM lesson
     WHERE chapter_id = $1 AND order_index > $2
     ORDER BY order_index ASC
     LIMIT 1`,
    [chapterId, orderIndex]
  );
  if (sameChapterResult.rows[0]) return sameChapterResult.rows[0].id;

  const nextChapterResult = await pool.query(
    `SELECT lesson.id
     FROM lesson
     JOIN chapter ON chapter.id = lesson.chapter_id
     WHERE chapter.course_id = $1 AND chapter.order_index > $2
     ORDER BY chapter.order_index ASC, lesson.order_index ASC
     LIMIT 1`,
    [courseId, chapterOrderIndex]
  );
  return nextChapterResult.rows[0]?.id ?? null;
}

async function create({ chapterId, title }) {
  return withOrderedInsert(
    { lockTable: "chapter", parentId: chapterId, childTable: "lesson", parentColumn: "chapter_id" },
    async (client, orderIndex) => {
      const result = await client.query(
        "INSERT INTO lesson (chapter_id, title, order_index) VALUES ($1, $2, $3) RETURNING *",
        [chapterId, title, orderIndex]
      );
      return result.rows[0];
    }
  );
}

async function update(id, { title }) {
  const result = await pool.query("UPDATE lesson SET title = $1 WHERE id = $2 RETURNING *", [
    title,
    id,
  ]);
  return result.rows[0] ?? null;
}

async function findSiblingIds(chapterId) {
  const result = await pool.query("SELECT id FROM lesson WHERE chapter_id = $1", [chapterId]);
  return result.rows.map((r) => r.id);
}

async function applyOrder(orderedIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query("UPDATE lesson SET order_index = $1 WHERE id = $2", [
        i + 1,
        orderedIds[i],
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getCascadeCounts(id) {
  const result = await pool.query(
    "SELECT COUNT(*) AS screen_count FROM screen WHERE lesson_id = $1",
    [id]
  );
  return result.rows[0];
}

async function deleteById(id) {
  await pool.query("DELETE FROM lesson WHERE id = $1", [id]);
}

export const lessonRepository = {
  findAllForChapter,
  findById,
  create,
  update,
  findSiblingIds,
  applyOrder,
  getCascadeCounts,
  deleteById,
};
