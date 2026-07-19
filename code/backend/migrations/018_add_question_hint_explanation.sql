-- Adds two learner-facing help fields to Question, both optional (a question authored before
-- this feature, or one an instructor chooses not to annotate, simply has neither).
--
-- hint: safe to show *before* an attempt -- a nudge, never the answer itself. Included in
-- toPublicQuestion's learner-facing shape unconditionally, same as options/items already are.
--
-- explanation: the "why" behind the correct answer. Must never appear in a pre-attempt response
-- (GET /questions, /screens/:id, /practice-sets/:id) for a learner caller -- that would leak the
-- answer before grading. It only ever reaches a learner via the attempt-submission response
-- (attempt.service.js's submitAttempt), after the server has already graded their answer, mirroring
-- the existing "correctAnswer on an incorrect attempt" precedent (Frontend Milestone 6).
ALTER TABLE question ADD COLUMN hint TEXT;
ALTER TABLE question ADD COLUMN explanation TEXT;
