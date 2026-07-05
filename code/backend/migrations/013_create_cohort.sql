-- 01-data-model.md §3 "Cohort"
-- instructor_id backs requireCohortOwnership (03-security-architecture.md §3.4 Variant A).
CREATE TABLE cohort (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  instructor_id UUID NOT NULL REFERENCES "user" (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cohort_instructor_id ON cohort (instructor_id);
