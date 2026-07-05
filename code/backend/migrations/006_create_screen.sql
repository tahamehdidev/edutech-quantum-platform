-- 01-data-model.md §3 "Screen" -- leaf node of the content cascade chain (no children).
-- content shape validated in application code (03-security-architecture.md §5.3), not DB-enforced.
CREATE TABLE screen (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('explanation', 'question', 'simulation')),
  content JSONB,
  order_index INTEGER NOT NULL
);

-- Backs resolveFromScreenId (03-security-architecture.md §3.4).
CREATE INDEX idx_screen_lesson_id ON screen (lesson_id);
