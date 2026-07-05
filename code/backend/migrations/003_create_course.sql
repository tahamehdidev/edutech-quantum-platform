-- 01-data-model.md §3 "Course"
-- created_by_id backs requireCourseOwnership (03-security-architecture.md §3.4 Variant C).
CREATE TABLE course (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  narrative TEXT,
  created_by_id UUID NOT NULL REFERENCES "user" (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_created_by_id ON course (created_by_id);
