import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isTest = NODE_ENV === "test";

// DATABASE_URL resolves to TEST_DATABASE_URL under NODE_ENV=test -- callers (config/db.js and
// everything downstream) never need to know which environment they're in; they just read
// env.DATABASE_URL. See backend/.env.example for how these map to the two Postgres roles
// (app_user for the app, the bootstrap role for migrations only).
export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: required(isTest ? "TEST_DATABASE_URL" : "DATABASE_URL"),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  FRONTEND_URL: required("FRONTEND_URL"),
};
