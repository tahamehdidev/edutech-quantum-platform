-- 01-data-model.md §3 "RefreshToken"
-- user_id CASCADEs: a session row has no historical value once its owning user is gone.
CREATE TABLE refresh_token (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_token_user_id ON refresh_token (user_id);
