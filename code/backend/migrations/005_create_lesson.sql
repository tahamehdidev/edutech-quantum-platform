-- 01-data-model.md §3 "Lesson"
CREATE TABLE lesson (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapter (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Backs resolveFromLessonId (03-security-architecture.md §3.4) and PracticeSet's lesson_id join.
CREATE INDEX idx_lesson_chapter_id ON lesson (chapter_id);
