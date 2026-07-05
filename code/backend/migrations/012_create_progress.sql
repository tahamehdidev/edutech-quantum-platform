-- 01-data-model.md §3 "Progress" -- doubles as the User<->Course junction table plus XP/streak/level.
-- No write endpoints exist for this table at all (02-api-contract.md §5.1) -- it only changes as
-- a side effect of POST /attempts.
CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user" (id),
  course_id INTEGER NOT NULL REFERENCES course (id),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  level INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);
