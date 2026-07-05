-- 01-data-model.md §3 "Question"
-- created_by_id backs requireQuestionEditAccess's creator path (03-security-architecture.md §3.4 Variant D).
-- No FK to Screen/PracticeSet -- reusable M:N via junction tables (ScreenQuestion/PracticeSetQuestion).
CREATE TABLE question (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'drag_drop', 'numeric')),
  content JSONB,
  created_by_id UUID NOT NULL REFERENCES "user" (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_created_by_id ON question (created_by_id);
