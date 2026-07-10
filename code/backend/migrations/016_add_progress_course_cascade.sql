-- 012_create_progress.sql's course_id FK was created without ON DELETE CASCADE, unlike every
-- other course-descendant table (chapter/lesson/screen all cascade -- see those migrations).
-- Course.deleteById() is a plain DELETE relying entirely on FK cascades to clean up everything
-- below it (02-api-contract.md §3.2's documented "cascades to chapters/lessons/screens"
-- behavior); without this, deleting any course a learner has actually submitted an attempt in
-- throws an unhandled 500 (Postgres FK violation) instead of cascading, since Progress rows are
-- created as a side effect of POST /attempts the moment real usage happens.
ALTER TABLE progress DROP CONSTRAINT progress_course_id_fkey;
ALTER TABLE progress ADD CONSTRAINT progress_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE;
