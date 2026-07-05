-- 01-data-model.md §3 "User"
-- gen_random_uuid() is built into PostgreSQL core since PG13 -- no pgcrypto extension needed.
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
