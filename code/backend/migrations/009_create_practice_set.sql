-- 01-data-model.md §3 "PracticeSet"
CREATE TABLE practice_set (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
  title TEXT NOT NULL
);

CREATE INDEX idx_practice_set_lesson_id ON practice_set (lesson_id);
