-- 01-data-model.md §3 "Chapter" -- part of the Course->Chapter->Lesson->Screen cascade-delete chain.
CREATE TABLE chapter (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES course (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Backs the courseOwnership hierarchy resolver's resolveFromChapterId (03-security-architecture.md §3.4).
CREATE INDEX idx_chapter_course_id ON chapter (course_id);
