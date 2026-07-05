-- Runs once, automatically, on first container boot (docker-entrypoint-initdb.d convention).
-- Creates the isolated test database alongside edutech_dev (created via POSTGRES_DB).
-- Owned by the bootstrap "postgres" role, same as edutech_dev -- app_user is created inside
-- each database separately by migrations/000_create_app_role.sql, not here.
CREATE DATABASE edutech_test;
