# EduTech Quantum Platform — Application Architecture

**Status:** Finalized
**Phase:** Application Architecture (Step 4 of pre-implementation design)
**Last updated:** June 2026
**Depends on:** `01-data-model.md`, `02-api-contract.md`, `03-security-architecture.md`

This document specifies where code actually lives and how a request physically moves through it. The previous three documents answered *what* the system does, *what* the API surface looks like, and *how* access is controlled; this document answers *where every piece of that lives as a file*, so implementation has a single, predictable structure to build into rather than inventing one ad hoc per feature.

---

## How to Read This Document

- **Section 1** — the layering rule this entire architecture is built on, stated once, applied with no exceptions anywhere in this document
- **Section 2** — backend folder structure
- **Section 3** — naming conventions, applied per resource
- **Section 4** — middleware and validator organization
- **Section 5** — frontend folder structure, deliberately mirroring the backend
- **Section 6** — error propagation: how a thrown error becomes the standardized HTTP response
- **Section 7** — `app.js` wiring and registration order

---

## 1. The Layering Rule

**Controller → Service → Repository, with no exceptions.** Every request, including trivially simple ones (a single lookup by id), passes through all three layers. No controller calls a repository directly; no middleware calls a repository directly either — middleware that needs data (e.g. an ownership check) calls a service, exactly like a controller would.

**Why mandatory, not case-by-case:** letting "simple" cases skip the service layer requires a judgment call about what counts as simple — and that judgment can become wrong later without anyone revisiting the decision. A `GET /courses/:id` lookup that's trivial today might need role-based field-stripping added next month (`02-api-contract.md` Section 4.4). If the controller already calls the repository directly, that logic either gets bolted onto the controller — breaking the layering inconsistently, for one route only — or someone has to remember to retrofit a service layer in exactly that one place. Mandating the service layer always means every route already has the right shape to grow into.

**Why middleware gets no exception either:** Step 3 already established that ownership-check middleware must query through the repository layer, never with inline SQL. This document extends that one step further: middleware must go through a service too, the same as a controller. The alternative — carving out a middleware-specific exception — would mean the codebase has one rule "usually," with a documented carve-out for the one case that felt structurally different. Treating middleware exactly like a controller means there is genuinely one rule, with zero exceptions to remember.

A useful side effect of this: business logic written once in a service (e.g. `cohortService.checkOwnership()`) becomes reusable by anything that needs it — middleware, a future controller, or another service calling it internally — rather than being duplicated wherever an ownership check happens to be needed.

### 1.1 Audit logging is written by the service performing the action (Step 6 addition)

`AuditLog` entries (`01-data-model.md` Section 3, `03-security-architecture.md` Section 8) are written by whichever service performs a logged action, as part of that same service call — not by a separate layer wrapping around it, and not by the controller.

```javascript
// services/course.service.js
async function deleteCourse(courseId, deletedByUserId) {
  const cascadeCounts = await courseRepository.getCascadeCounts(courseId); // for the audit metadata
  await courseRepository.delete(courseId);
  await auditLogService.record({
    userId: deletedByUserId,
    action: "course.deleted",
    resourceType: "Course",
    resourceId: String(courseId),
    metadata: cascadeCounts,
  });
}
```

**Why the service writes it, not the controller:** the controller's job is HTTP concerns — it doesn't necessarily have every piece of context (like `cascadeCounts` above) that makes an audit entry useful, and that context is naturally available exactly where the action itself happens. Writing the audit entry as part of the same service call also means it's covered by the same database transaction as the action it's logging, where applicable — avoiding a window where the action succeeds but the log entry fails to write, or vice versa.

`auditLogService.record()` is itself a thin function — it validates nothing (there's no untrusted client input involved, since this is always called from trusted internal code, never from a request body) and simply calls `auditLogRepository.create()`. It exists as a named, single entry point specifically so every call site looks the same, rather than each service constructing the insert independently.

---

## 2. Backend Folder Structure

```
backend/
├── src/
│   ├── routes/           # URL -> controller mapping only. No logic.
│   ├── controllers/      # HTTP concerns: parse request, call service, shape response
│   ├── services/         # Business logic. No HTTP knowledge, no direct SQL.
│   ├── repositories/      # Only layer that talks to PostgreSQL
│   ├── middleware/        # Auth, RBAC, rate-limiting, validation (Step 3)
│   ├── validators/        # Zod schemas, one file per resource
│   ├── models/            # Shared shape definitions
│   ├── utils/             # Pure helper functions (hashing, token generation, asyncHandler, email normalization)
│   ├── errors/            # Typed error classes (Section 6)
│   ├── config/            # Environment loading, DB connection setup, constants (e.g. argon2 params)
│   └── app.js             # Express app setup — middleware registration, route mounting (Section 7)
├── tests/
│   ├── unit/               # Service and util tests — no real database
│   └── integration/        # Full request/response tests against a test database
└── scripts/                # One-off operational scripts, e.g. create-admin.js (03-security-architecture.md §0.1)
```

**Why `errors/` is its own folder, not folded into `utils/`:** every error case across the API contract (`VALIDATION_ERROR`, `FORBIDDEN`, `RATE_LIMITED`, and the rest) becomes its own error class carrying an HTTP status and code, so a service can `throw new ForbiddenError(...)` and have exactly one place translate that into the standardized response — rather than every controller manually constructing that object inline, risking format drift between them.

**Why `scripts/` sits outside `src/`:** these aren't part of the running application. `create-admin.js` is invoked manually from the command line and is never imported by `app.js`. Keeping it physically outside `src/` makes that boundary visible from folder structure alone, without needing a comment to explain it.

---

## 3. Naming Conventions

### 3.1 Singular, resource-named files

```
src/controllers/cohort.controller.js
src/services/cohort.service.js
src/repositories/cohort.repository.js
src/validators/cohort.validator.js
src/routes/cohort.routes.js
```

Singular and matching the database entity exactly, not the route path. Naming by route path produces ambiguity at nested endpoints — is the file backing `POST /cohorts/:id/students` called `cohorts.controller.js` or `students.controller.js`? The resource actually being manipulated there is `CohortEnrollment`, not "students" as a standalone concept. Naming by the entity each file actually operates on gives one unambiguous answer in every case; naming by route forces a judgment call at every nested endpoint.

### 3.2 Full resource list and which files each one actually has

The five-file pattern (`controller`/`service`/`repository`/`validator`/`routes`) is the *default shape*, not a rigid requirement that every file must contain something. Several resources deliberately have fewer files, for reasons already established in earlier documents:

| Resource | Files | Note |
|---|---|---|
| `User` | full set | |
| `RefreshToken` | service + repository only | Never exposed via its own controller/routes — `03-security-architecture.md` §2 keeps it internal to the auth flow |
| `Course` | full set | |
| `Chapter` | full set | |
| `Lesson` | full set | |
| `Screen` | full set | |
| `Question` | full set | |
| `ScreenQuestion` | full set, no dedicated routes file | Endpoints nested under `screen.routes.js` (e.g. `POST /screens/:id/questions`) |
| `PracticeSet` | full set | |
| `PracticeSetQuestion` | full set, no dedicated routes file | Nested under `practiceSet.routes.js` |
| `Attempt` | full set | |
| `Progress` | service + repository only | No controller/routes — `02-api-contract.md` §5.1 deliberately specifies zero write endpoints; reads are served through `attempt`/dashboard controllers |
| `Cohort` | full set | |
| `CohortEnrollment` | full set, no dedicated routes file | Nested under `cohort.routes.js` (e.g. `POST /cohorts/:id/students`) |
| `Dashboard` (Group 6, `02-api-contract.md` §7) | controller + service only, no repository | Aggregates data already owned by other repositories (`progressRepository`, `attemptRepository`); does not own a table of its own |
| `AuditLog` (Step 6 addition) | controller + service + repository, no validator, minimal routes | `GET /audit-log` only (`02-api-contract.md` §8) — read-only, admin-only, no request body to validate. Entries are written internally by other services (e.g. `courseService.delete()` writes an entry as part of its own logic), never via a dedicated write endpoint. |

### 3.3 Junction tables are full resources, not folded into their owner

`CohortEnrollment`, `ScreenQuestion`, and `PracticeSetQuestion` each get their own complete file set, the same as any standalone resource — not absorbed into `cohort.service.js` or `screen.service.js`.

**Why, given they're "just" junction tables:** this keeps the codebase consistent with a decision already made in `03-security-architecture.md` Section 3.4, where `cohortEnrollmentRepository.existsForInstructor()` was written as its own dedicated repository function, not folded into `cohortRepository`. Treating junction tables as full resources everywhere makes that the established pattern rather than a one-off exception. It also pays off concretely for `CohortEnrollment`, which carries real logic of its own — the partial unique index check, status transitions, the ownership-check query — enough to disproportionately bloat `cohort.service.js` if crammed in alongside it.

---

## 4. Middleware and Validator Organization

### 4.1 Middleware is organized by function, not by resource

This is a deliberate contrast with Section 3's per-resource pattern. `requireRole` isn't "about" any one resource — it's a generic mechanism reused across all of them. Organizing middleware per-resource would mean near-duplicate files; organizing by function keeps each piece of logic in exactly one place, imported by many resources' route files.

```
src/middleware/
├── auth.middleware.js           # Global JWT verification, public-route whitelist (03-security-architecture.md §3.2)
├── role.middleware.js           # requireRole() factory (§3.3)
├── ownership.middleware.js      # requireCohortOwnership, requireStudentOwnership, requireCourseOwnership (§3.4)
├── validateParams.middleware.js # validateUuidParam and the integer-id equivalent (§3.4)
├── validateBody.middleware.js   # Generic Zod-schema-driven body validator (§5.1)
├── rateLimit.middleware.js      # Per-endpoint limiter configs (§4)
└── errorHandler.middleware.js   # Central error handler (Section 6 of this document) — registered last, see Section 7
```

### 4.2 Ownership-check middleware calls a service, never a repository directly

Consistent with Section 1's layering rule applying with no exceptions: `ownership.middleware.js` calls e.g. `cohortService.checkOwnership(...)`, never `cohortRepository.findById(...)` directly. See Section 6 for how this looks once error propagation is wired in.

### 4.3 Validators are organized per-resource, mirroring controllers

Unlike middleware, Zod schemas are naturally resource-specific, so they follow the same naming convention as Section 3:

```
src/validators/
├── auth.validator.js       # SignupSchema, LoginSchema
├── cohort.validator.js     # CreateCohortSchema, EnrollStudentSchema
├── question.validator.js   # CreateQuestionSchema + the type-branching validateQuestionContent()
├── screen.validator.js     # CreateScreenSchema + the type-branching validateScreenContent()
└── ...                      # one per resource that accepts a request body
```

The `Question`/`Screen` content-branching validators specified in `03-security-architecture.md` Sections 5.2–5.3 live inside these same per-resource files — not a separate folder — since they're still fundamentally "the validator for this resource," just a more complex one due to branching on a sibling `type` field.

**Concrete task this implies:** every `POST`/`PATCH` endpoint in `02-api-contract.md` needs a corresponding Zod schema in one of these files before implementation starts on that endpoint — roughly one schema per write endpoint, enumerable directly from the contract's endpoint tables.

---

## 5. Frontend Folder Structure

Deliberately mirrors the backend, so that anyone implementing a feature can predict where related frontend code lives just from knowing where the corresponding backend code lives.

```
frontend/src/
├── pages/              # One file per route/screen the user navigates to
├── components/         # Reusable UI pieces, organized by feature area
├── hooks/              # Custom React hooks, especially data-fetching ones
├── services/           # API client functions — one file per backend resource, mirroring src/controllers/
├── context/            # React Context providers (auth state, etc.)
└── utils/              # Pure helper functions
```

### 5.1 `services/` is built completely, up front, mirroring the full contract

Every backend resource gets a matching frontend service file, written before UI work begins on any given screen — not incrementally, only as each screen happens to need it.

**Why up-front is the right call specifically here, not as a universal rule:** building service functions up front only works well when the contract they're built against is already fully specified and stable — which is exactly this project's situation, since `02-api-contract.md` was deliberately finished and reviewed *before* this step. Building incrementally is the better choice when the contract itself is still being discovered during implementation; that's not the situation here, because Steps 1–3 deliberately front-loaded that uncertainty so implementation wouldn't have to resolve it mid-build. The payoff: building a screen becomes "wire up existing functions to components" — a mechanical task — rather than alternating between building UI and writing new API functions reactively.

```
frontend/src/services/
├── apiClient.js            # Shared axios instance — auth header injection, 401-triggered refresh retry (5.2)
├── auth.service.js         # signup, login, logout, logoutAll, refresh
├── user.service.js         # getMe, updateMe
├── course.service.js
├── chapter.service.js
├── lesson.service.js
├── screen.service.js
├── question.service.js
├── practiceSet.service.js
├── attempt.service.js      # submitAttempt, getMyAttempts, getUserAttempts
├── progress.service.js     # getMyProgress, getUserProgress — read-only, deliberately no write functions
├── cohort.service.js       # includes enrollment functions, mirroring CohortEnrollment nested under cohort routes
└── dashboard.service.js    # getCompletionStats, getLessonPacing
```

**`progress.service.js` deliberately has no write function.** The frontend service layer mirrors the backend's *absence* of a capability just as faithfully as it mirrors what exists — `02-api-contract.md` Section 5.1 specifies zero write endpoints for `Progress`, by design, so a frontend write function here would be a dead end pointing at an endpoint that doesn't exist.

### 5.2 `apiClient.js` — where 15-minute access tokens become invisible to the rest of the frontend

```javascript
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
});

apiClient.interceptors.request.use((config) => {
  const token = authStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retried) {
      error.config._retried = true;
      await authStore.refreshAccessToken(); // calls POST /auth/refresh
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

Every other service file calls `apiClient.get(...)` / `.post(...)` normally; token refresh happens transparently underneath via the interceptor, so no individual screen needs to know or care that access tokens expire every 15 minutes.

---

## 6. Error Propagation

### 6.1 One central handler — services and repositories throw, exactly one place translates

Services and repositories throw typed errors; a single Express error-handling middleware, registered last in the chain (Section 7), converts any thrown error into the standardized `{ error: { code, message, field } }` response from `02-api-contract.md` Section 0.3.

**Why centralizing beats letting each layer construct its own response:** a mixed pattern — some middleware returning responses directly, some services returning result objects for controllers to interpret — requires every controller to remember, case by case, which pattern a given function uses. That knowledge has to be relearned for every new resource added later. With one central handler, every controller and service follows exactly one rule: if something is wrong, throw. Adding a new error case later requires zero changes to the error-handling plumbing — just `throw new SomeError(...)` from wherever the problem is detected.

### 6.2 Typed error classes

```javascript
// errors/AppError.js
class AppError extends Error {
  constructor(code, message, statusCode, field = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
  }
}
```

One subclass per error code already defined in `02-api-contract.md` Section 0.3:

```javascript
// errors/index.js
class ValidationError extends AppError {
  constructor(message, field = null) { super("VALIDATION_ERROR", message, 400, field); }
}
class NotFoundError extends AppError {
  constructor(message = "Resource not found.") { super("NOT_FOUND", message, 404); }
}
class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") { super("FORBIDDEN", message, 403); }
}
class ConflictError extends AppError {
  constructor(message, field = null) { super("DUPLICATE_RESOURCE", message, 409, field); }
}
class UnauthenticatedError extends AppError {
  constructor(message = "Not authenticated.") { super("UNAUTHENTICATED", message, 401); }
}
class RateLimitedError extends AppError {
  constructor(message = "Too many requests. Please try again later.") { super("RATE_LIMITED", message, 429); }
}
// Same shape for the remaining codes: INVALID_CREDENTIALS, INVALID_ROLE_FOR_ACTION,
// CONTEXT_MISMATCH, REORDER_SET_MISMATCH, EMAIL_ALREADY_REGISTERED.

module.exports = { AppError, ValidationError, NotFoundError, ForbiddenError, ConflictError, UnauthenticatedError, RateLimitedError /* ...rest */ };
```

### 6.3 The central error handler

```javascript
// middleware/errorHandler.middleware.js
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.field && { field: err.field }) },
    });
  }

  // Anything that is NOT one of our deliberately-thrown typed errors is treated as a
  // bug, not a client-facing failure — never leak its raw message or stack trace.
  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}

module.exports = errorHandler;
```

**The `instanceof AppError` branch is the actual safety property here.** Anything not deliberately thrown as one of our typed errors — a stray database error, a null-pointer bug, an unexpected exception — can never accidentally leak internal details into a client response, because the only way to reach the client with a specific code and message is to have explicitly thrown one of the typed errors yourself.

### 6.4 End-to-end example: ownership check, fully wired

```javascript
// services/cohort.service.js
async function checkOwnership(instructorId, cohortId) {
  const cohort = await cohortRepository.findById(cohortId); // the service is the only caller of the repository
  if (!cohort) throw new NotFoundError("Cohort not found.");
  if (cohort.instructorId !== instructorId) throw new ForbiddenError("You do not own this cohort.");
  return cohort;
}
```
```javascript
// middleware/ownership.middleware.js
const requireCohortOwnership = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next();
  req.cohort = await cohortService.checkOwnership(req.user.id, req.params.id); // throws -> asyncHandler catches -> errorHandler responds
  next();
});
```

Note this middleware contains no `try`/`catch` and constructs no response itself — it just calls a service and lets `asyncHandler` (Section 6.5) forward any thrown error to the central handler.

### 6.5 `asyncHandler` — catching async errors without writing try/catch everywhere

Express does not automatically catch errors thrown inside `async` route handlers or middleware; an unhandled rejection inside one hangs the request rather than reaching `errorHandler`, unless wrapped.

```javascript
// utils/asyncHandler.js
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
```

**Why a wrapper, not hand-written `try`/`catch` everywhere:** a manual, repeated pattern is exactly the kind of thing that's easy to forget once — and "easy to forget once" is how bugs slip through on a solo project with no second reviewer to catch the omission. A wrapper makes the correct behavior the *only* way to write a controller or middleware function, rather than a discipline that has to be remembered and reapplied every single time one is added.

Applied identically to controllers and middleware:

```javascript
// controllers/cohort.controller.js
const getCohortController = asyncHandler(async (req, res) => {
  res.status(200).json({ cohort: req.cohort }); // already fetched and validated by requireCohortOwnership
});

const enrollStudentController = asyncHandler(async (req, res) => {
  const result = await cohortService.enrollStudent(req.params.id, req.validatedBody.userId);
  res.status(201).json({ enrollment: result });
});
```

---

## 7. `app.js` — Registration Order

```javascript
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true })); // 03-security-architecture.md §6.1
app.use(express.json());
app.use(authMiddleware); // 03-security-architecture.md §3.2 — JWT verification + public-route whitelist

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/courses", courseRoutes);
app.use("/chapters", chapterRoutes);
app.use("/lessons", lessonRoutes);
app.use("/screens", screenRoutes);
app.use("/questions", questionRoutes);
app.use("/practice-sets", practiceSetRoutes);
app.use("/attempts", attemptRoutes);
app.use("/progress", progressRoutes);
app.use("/cohorts", cohortRoutes);
app.use("/health", healthRoutes);

app.use(errorHandler); // MUST be registered last
```

**`errorHandler` must be the final middleware registered, with no exceptions.** Express only treats a four-argument middleware function as an error handler if it's the last one registered in the chain. Placed anywhere else, it silently never gets called, and thrown errors fall through to Express's own default (unhelpful, non-standardized) error response instead of the format every other document in this project assumes is in place.

---
