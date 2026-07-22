# Code

The full implementation of Qubit — NUST, structured according to
[`../docs/04-application-architecture.md`](../docs/04-application-architecture.md).

**Status:** Feature complete. Backend, frontend, all eight interactive widgets, and content for
all three courses are built and tested. See the [root README](../README.md) for the full
overview, architecture diagram, and setup instructions — this file covers only what's specific
to working inside `code/`.

## Structure

```
code/
├── backend/            Node.js + Express API
├── frontend/            React + Vite application
└── docker-compose.yml  Local Postgres (two roles — see backend/migrations/000_create_app_role.sql)
```

(`render.yaml`, the Render Blueprint for the backend + database, lives at the repo root, one
level up — Render's Blueprint auto-detection looks for it there.)

## What's mechanically enforced

- **Layering rule** (controller → service → repository, no exceptions) — `eslint-plugin-import`'s
  `no-restricted-paths` in `backend/eslint.config.js` fails `npm run lint` if a controller or
  middleware file imports a repository directly.
- **CI** (`.github/workflows/ci.yml`) — lint, format-check, and test/build for both `backend/`
  and `frontend/` on every push and PR to `main`.

## Local setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Full step-by-step setup (Docker Postgres, seeding all three courses, creating an admin account)
is in the [root README](../README.md#getting-started).

## Before changing anything here

Read, in order:
1. [`../docs/01-data-model.md`](../docs/01-data-model.md)
2. [`../docs/02-api-contract.md`](../docs/02-api-contract.md)
3. [`../docs/03-security-architecture.md`](../docs/03-security-architecture.md)
4. [`../docs/04-application-architecture.md`](../docs/04-application-architecture.md) — this
   folder's structure comes directly from this document; if something here seems inconsistent
   with it, the doc is the source of truth.
5. [`../docs/06-threat-model.md`](../docs/06-threat-model.md) — read before touching `AuditLog`
   or anything involving `Question`/`Cohort` ownership; it explains *why* those checks are shaped
   the way they are, including two deliberately accepted risks.
