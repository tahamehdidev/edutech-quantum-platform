# EduTech Quantum Learning Platform

An interactive learning platform for three quantum computing courses (Hardware, Algorithms, Machine Learning), built for the NUST Quantum Computing Lab.

**Status:** Design phase. No application code has been written yet — see `docs/` for everything produced so far.

## Repo Structure

```
.
├── docs/   Design documents — produced before any code, in order
└── code/   Empty for now. Implementation begins only after all docs below are complete.
```

## Design Documents

| # | Document |
|---|---|---|
| 1 | [`01-data-model.md`](docs/01-data-model.md) — database schema, ER diagram, rationale |
| 2 | [`02-api-contract.md`](docs/02-api-contract.md) — endpoints, request/response shapes, roles |
| 3 | [`03-security-architecture.md`](docs/03-security-architecture.md) — auth flow, RBAC, rate limiting, validation strategy |
| 4 | [`04-application-architecture.md`](docs/04-application-architecture.md) — project/folder structure, code organization |
| 5 | Tooling & environment setup — see [`code/`](code/) |
| 6 | [`06-threat-model.md`](docs/06-threat-model.md) — misuse scenarios and the security checklist they produce | 

## Code Scaffold

The `code/` folder contains the full backend + frontend scaffold matching `04-application-architecture.md` — folder structure, ESLint (with the layering rule mechanically enforced), Prettier, CI, and dependency lists. No application code has been written yet; see [`code/README.md`](code/README.md).

## Author

Taha Mehdi 
