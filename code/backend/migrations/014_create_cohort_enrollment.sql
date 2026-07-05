-- 01-data-model.md §3 "CohortEnrollment"
-- status='removed' rows are kept, never deleted, to preserve enrollment history.
CREATE TABLE cohort_enrollment (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES cohort (id),
  user_id UUID NOT NULL REFERENCES "user" (id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A student can have only one *active* enrollment per cohort, but any number of historical
-- (removed) rows -- a flat UNIQUE constraint can't express this conditional rule.
CREATE UNIQUE INDEX one_active_enrollment_per_cohort
  ON cohort_enrollment (cohort_id, user_id)
  WHERE status = 'active';

-- Backs requireStudentOwnership's existsForInstructor() join (03-security-architecture.md §3.4
-- Variant B) -- deliberately no partial WHERE status='active' here, since that check must see
-- historical enrollments too.
CREATE INDEX idx_cohort_enrollment_user_id ON cohort_enrollment (user_id);
CREATE INDEX idx_cohort_enrollment_cohort_id ON cohort_enrollment (cohort_id);
