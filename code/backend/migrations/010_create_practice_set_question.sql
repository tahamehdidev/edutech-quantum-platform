-- 01-data-model.md §3 "PracticeSetQuestion" (junction). Same 409-via-composite-PK pattern as
-- ScreenQuestion.
CREATE TABLE practice_set_question (
  practice_set_id INTEGER NOT NULL REFERENCES practice_set (id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES question (id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (practice_set_id, question_id)
);

-- Backs the second junction path requireQuestionEditAccess traverses (Variant D).
CREATE INDEX idx_practice_set_question_question_id ON practice_set_question (question_id);
