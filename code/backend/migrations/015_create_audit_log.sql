-- 01-data-model.md §3 "AuditLog" -- append-only, database-enforced (03-security-architecture.md
-- §8.2), not just an application convention. resource_id is TEXT, not a typed FK: a single table
-- spanning resource types with mixed ID types (UUID vs integer) can't have one strongly-typed
-- reference, and a FK would actively break logging a resource's own deletion.
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user" (id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user_id ON audit_log (user_id);
CREATE INDEX idx_audit_log_resource_type ON audit_log (resource_type);

-- The actual enforcement mechanism. Overrides 000_create_app_role.sql's default UPDATE/DELETE
-- grant for this one table. Meaningful specifically because app_user is neither this table's
-- owner nor a superuser (see 000_create_app_role.sql) -- both of which would silently bypass
-- this REVOKE. Holds even under full application compromise, since it isn't something the
-- application's own code enforces.
REVOKE UPDATE, DELETE ON audit_log FROM app_user;
GRANT INSERT, SELECT ON audit_log TO app_user;
