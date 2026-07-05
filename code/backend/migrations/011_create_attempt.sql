-- 01-data-model.md §3 "Attempt"
-- context_id is deliberately not a FK (polymorphic across Screen/PracticeSet) -- validated in
-- application code (02-api-contract.md §5.3 step 2).
CREATE TABLE attempt (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user" (id),
  question_id INTEGER NOT NULL REFERENCES question (id),
  context_type TEXT NOT NULL CHECK (context_type IN ('screen', 'practice_set')),
  context_id INTEGER NOT NULL,
  answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempt_user_id ON attempt (user_id);

-- Backs the "does a prior correct attempt exist for (user, question)?" EXISTS check that must
-- run before every insert (02-api-contract.md §5.3 step 5) -- a partial index scoped to exactly
-- the rows that query cares about, same pattern as CohortEnrollment's partial unique index.
CREATE INDEX idx_attempt_user_question_correct ON attempt (user_id, question_id) WHERE is_correct = true;
