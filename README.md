# EduTech Quantum Learning Platform

An interactive learning platform for three quantum computing courses — Hardware, Algorithms, and Machine Learning — built for the NUST Quantum Computing Lab.

**Status:** Content design complete. Backend and frontend implementation beginning.

---

## Repo Structure

```
.
├── docs/    Design and content documents, produced before any code
└── code/    Backend + frontend scaffold — application code in progress
```

---

## Documents

### Architecture & Security (`docs/`)

| # | Document | What it covers |
|---|---|---|
| 1 | [`01-data-model.md`](docs/01-data-model.md) | Database schema, ER diagram, design rationale |
| 2 | [`02-api-contract.md`](docs/02-api-contract.md) | All endpoints, request/response shapes, role rules |
| 3 | [`03-security-architecture.md`](docs/03-security-architecture.md) | Auth flow, RBAC, rate limiting, input validation |
| 4 | [`04-application-architecture.md`](docs/04-application-architecture.md) | Folder structure, layering rules, error propagation |
| 6 | [`06-threat-model.md`](docs/06-threat-model.md) | STRIDE threat model per actor, mitigations, accepted risks |

### Course Content (`docs/`)

| # | Document | What it covers |
|---|---|---|
| 7 | [`07-course-narratives-spine.md`](docs/07-course-narratives-spine.md) | Chapter-level narrative spine for all three courses |
| 8 | [`08-quantum-machine-learning-course.md`](docs/08-quantum-machine-learning-course.md) | Full lesson/screen breakdown — QML (6 chapters, 25 lessons, 118 screens) |
| 9 | [`09-quantum-algorithms-course.md`](docs/09-quantum-algorithms-course.md) | Full lesson/screen breakdown — Algorithms (6 chapters, 24 lessons, 106 screens) |
| 10 | [`10-quantum-computing-hardware-course.md`](docs/10-quantum-computing-hardware-course.md) | Full lesson/screen breakdown — Hardware (6 chapters, 22 lessons, 89 screens) |

---

## Code

See [`code/README.md`](code/README.md) for full details.

### Backend (`code/backend/`)

Node.js + Express REST API. Folder structure matches `04-application-architecture.md` exactly:
`routes/ → controllers/ → services/ → repositories/` with no exceptions enforced by ESLint.

**Seed data** in `code/backend/seeds/` — three JSON files, one per course, containing all chapters, lessons, screens, and questions with final learner-facing copy. Load order and instructions in [`code/backend/seeds/README.md`](code/backend/seeds/README.md).

### Frontend (`code/frontend/`)

React (Vite). Component library built around the lesson-screen pattern observed on Brilliant.org.

### CI (`code/.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:
- Backend: lint (including layering-rule enforcement), format check, test suite
- Frontend: lint, format check, build

---

## Author

Taha Mehdi — Backend Engineer
Internship, Quantum Computing Lab, NUST — June 2026
