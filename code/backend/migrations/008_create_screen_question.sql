-- 01-data-model.md §3 "ScreenQuestion" (junction). Composite PK mirrors the API contract's
-- 409-on-duplicate-attach behavior (02-api-contract.md §4.1) -- the DB constraint IS the
-- enforcement mechanism; the controller just translates a violation into a clean 409.
CREATE TABLE screen_question (
  screen_id INTEGER NOT NULL REFERENCES screen (id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES question (id) ON DELETE CASCADE,
  PRIMARY KEY (screen_id, question_id)
);

-- Backs one of the two junction paths requireQuestionEditAccess traverses (Variant D).
CREATE INDEX idx_screen_question_question_id ON screen_question (question_id);
