-- Creates the restricted role the running server connects as (DATABASE_URL / TEST_DATABASE_URL).
-- Deliberately distinct from the role this migration runner itself connects as
-- (ADMIN_DATABASE_URL / ADMIN_TEST_DATABASE_URL, docker-compose.yml's bootstrap "postgres" role,
-- which owns every table created by these migrations).
--
-- Why this separation matters: PostgreSQL superusers AND table owners always bypass GRANT/REVOKE
-- checks on objects they superuser-over/own. If app_user were also the table owner (as it would
-- be if it ran these migrations itself) or a superuser, 015_create_audit_log.sql's
-- "REVOKE UPDATE, DELETE ON audit_log FROM app_user" would be a syntactically valid no-op —
-- app_user could still UPDATE/DELETE rows via its ownership/superuser privilege, silently
-- defeating the one control 03-security-architecture.md Section 8.2 says "holds even if the
-- application itself is fully compromised."
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;

-- Applies automatically to every table/sequence the migration runner (this same connection)
-- creates from here on, so individual CREATE TABLE migrations below don't need their own
-- per-table GRANT statements. 015_create_audit_log.sql explicitly REVOKEs UPDATE/DELETE
-- immediately after creating that one table, overriding this default for audit_log only.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
