# Code

This is the implementation scaffold for the EduTech Quantum Learning Platform, structured according to `../docs/04-application-architecture.md`.

**Status:** Scaffold only. No application code has been written yet — folders, lint config, CI, and dependency lists are in place, but `src/` files are empty placeholders (`.gitkeep`). Implementation begins after the remaining design docs (`05-tooling-setup.md` through `07-timeline.md`) are complete.

## Structure

```
code/
├── backend/    Node.js + Express API — see docs/04-application-architecture.md Sections 2-4
└── frontend/   React + Vite application — see docs/04-application-architecture.md Section 5
```

## What's already enforced

- **Layering rule** (controller → service → repository, no exceptions) is mechanically enforced by ESLint's `import/no-restricted-paths` rule in `backend/eslint.config.js` — a controller or middleware file that imports a repository directly will fail `npm run lint`.
- **CI** (`.github/workflows/ci.yml`) runs lint, format-check, and test/build on every push to `main` for both `backend/` and `frontend/`.

## Local setup (once implementation begins)

### Backend
```bash
cd backend
cp .env.example .env   
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Before writing any code here

Read, in order:
1. `../docs/01-data-model.md`
2. `../docs/02-api-contract.md`
3. `../docs/03-security-architecture.md`
4. `../docs/04-application-architecture.md` — this folder's structure comes directly from this document; if something here seems inconsistent with it, the doc is the source of truth and this folder should be corrected to match.
5. `../docs/06-threat-model.md` — read this before building `AuditLog` or anything touching `Question`/`Cohort` ownership specifically; it explains *why* those checks are shaped the way the other docs specify, including two deliberately accepted risks worth knowing about before they're implemented.
