-- Same class of gap as 016_add_progress_course_cascade.sql: attempt.question_id (011) was created
-- without ON DELETE CASCADE. DELETE /questions/:id is a real, reachable endpoint (02-api-contract.md
-- §4.2, "cascades to attachments, no pre-check") whose repository issues a plain DELETE relying
-- entirely on FK cascades -- but any question a learner has actually answered has an Attempt row,
-- so deleting it threw an unhandled 500 (Postgres FK violation) instead of the documented cascade.
-- Confirmed live before this fix (create question -> attach -> submit a real attempt -> delete
-- the question -> 500).
--
-- attempt.user_id is deliberately left alone: there is no user-delete endpoint anywhere in this
-- API (users/me only supports GET/PATCH), so that FK is currently unreachable, not broken -- and
-- unlike Progress/Attempt-on-Course, cascading a user's Attempt history away if account deletion
-- is ever added later is a real product decision (the same "preserve history" reasoning
-- 01-data-model.md gives for CohortEnrollment), not an obvious default to bake in now.
ALTER TABLE attempt DROP CONSTRAINT attempt_question_id_fkey;
ALTER TABLE attempt ADD CONSTRAINT attempt_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES question (id) ON DELETE CASCADE;
