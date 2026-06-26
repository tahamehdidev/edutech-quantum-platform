# EduTech Quantum Platform — Threat Model

**Status:** Finalized
**Phase:** Threat Modeling (Step 6 of pre-implementation design)
**Last updated:** June 2026
**Depends on:** `01-data-model.md`, `02-api-contract.md`, `03-security-architecture.md`, `04-application-architecture.md` (all four amended during this step — see their amendment notes)

Every previous document was constructive: build the schema, build the contract, build the defenses, build the structure. This document inverts that posture. Instead of asking "what should this system do," it asks **"how would someone try to break it, abuse it, or get more than they're entitled to."** The output isn't new architecture — it's a deliberate adversarial pass over architecture that already exists, producing either confirmation that a given design holds up, or a genuine, previously-unexamined gap.

---

## How to Read This Document

- **Section 1** — method: STRIDE, applied per actor, and why per-actor matters
- **Sections 2–6** — one section per actor, each walked through all six STRIDE categories
- **Section 7** — consolidated list of every gap found, fix applied, and risk knowingly accepted
- **Section 8** — schema and contract amendments this step produced, for cross-reference

---

## 1. Method

**STRIDE** structures the question "what could go wrong" into six distinct categories, so the analysis doesn't just catch whatever threat happens to come to mind first:

| Category | Question |
|---|---|
| **S**poofing | Can someone pretend to be a different user? |
| **T**ampering | Can someone modify data they shouldn't be able to? |
| **R**epudiation | Can someone deny having done something, with no way to prove otherwise? |
| **I**nformation disclosure | Can someone see data they shouldn't? |
| **D**enial of service | Can someone make the system unusable for others? |
| **E**levation of privilege | Can someone gain access or role beyond what they were granted? |

**Applied per actor, not generically.** A `learner` attacking the system looks nothing like an `instructor` attacking it, which looks nothing like an outside, unauthenticated attacker. Treating "the attacker" as one generic person misses entire categories of threat that only apply to a specific role's specific capabilities.

**Actors modeled:** (1) Unauthenticated outsider, (2) Learner, (3) Instructor, (4) Admin, (5) Compromised/malicious admin account. Actor 5 is categorically different from 1–4: it doesn't ask whether access control correctly enforces a boundary, it asks what happens once the trust assumption behind a role is itself broken — see Section 6.

---

## 2. Actor 1 — Unauthenticated Outsider

No account; only public endpoints are reachable (`POST /auth/signup`, `POST /auth/login`, `GET /health` — `02-api-contract.md` Section 0.4).

| STRIDE | Finding |
|---|---|
| Spoofing | No gap. Login requires a correct password (argon2-verified); the timing-safe dummy-hash check (`03-security-architecture.md` §1.3) already closes the "guess which emails exist via timing" side channel. |
| Tampering | No gap. Every write requires authentication; public routes are explicitly whitelisted and contain no writes except `signup`. |
| Repudiation | Not applicable — no attributable action exists at this trust level. |
| Information disclosure | **Gap identified, accepted.** `POST /auth/signup`'s `409 EMAIL_ALREADY_REGISTERED` lets an outsider enumerate registered emails by repeated signup attempts. Accepted as low-severity: unlike the login-timing case, this only reveals "this email has an account," roughly the same information a "forgot password" flow leaks anyway — it doesn't help an attacker get closer to actually accessing that account. |
| Denial of service | No gap. `POST /auth/signup` (5/hour/IP) and `POST /auth/login` (20/15min/IP + 5/15min/account) already cover this (`03-security-architecture.md` §4.2). |
| Elevation of privilege | No gap. Signup always forces `role = 'learner'` server-side; a `role` field in the request body is ignored even if present. |

**Actor 1 summary:** one accepted, low-severity gap (email enumeration via signup). Everything else already covered by Steps 2–3 — a good sign the earlier steps were genuinely thorough for this actor.

---

## 3. Actor 2 — Learner

The richest attack surface among "legitimate" actors: broad read access, one significant write capability (`POST /attempts`).

### 3.1 Spoofing
No gap. Reduces to token forgery/theft, already covered by signed short-lived access tokens and `httpOnly` single-use refresh tokens (`03-security-architecture.md` §2). Contingent on stored XSS never being possible — see Tampering, Instructor actor (Section 4) for the closest related risk.

### 3.2 Tampering

**Confirmed, not a gap:** `POST /attempts` derives `userId` entirely from the authenticated session, never the request body — the same mass-assignment principle applied everywhere else in this contract. This was previously only *implied* by omission in `02-api-contract.md`; now stated explicitly (Section 5.3 amendment).

**No gap:** `Progress` has zero write endpoints — nothing to tamper with directly.

**No gap, contingent on implementation correctness:** the context-validation steps in `POST /attempts` (verify `contextId` exists, verify the question is actually attached via the junction table) prevent answering a question never shown in that context. Flagged as a priority unit test.

**Gap found and closed — XP farming.** Nothing previously limited how many times a learner could re-answer the same question for repeated `Progress.xp` gains, which would make XP measure button-clicks rather than learning.

**Fix:** XP is awarded only on a user's first **correct** attempt per question — checked via `EXISTS (SELECT 1 FROM attempt WHERE user_id = ... AND question_id = ... AND is_correct = true)`, evaluated *before* inserting the new attempt row (the check must run first, or it will always see itself and never detect "no prior correct attempt" correctly). Every attempt is still recorded regardless — full history is preserved, only the XP side effect is conditional. XP is awarded on the first *correct* attempt even if earlier attempts on the same question were wrong, which matches the platform's attempt-and-feedback pedagogical model rather than only rewarding first-try success. See `02-api-contract.md` Section 5.3.

### 3.3 Repudiation
Not separately analyzed — `Attempt` rows are timestamped and immutable by design (no update/delete endpoint), which already provides a non-repudiable record of what a learner submitted.

### 3.4 Information Disclosure
No gap. `GET /attempts?userId=:id` / `GET /progress?userId=:id` are role-gated to `instructor`/`admin` only — a `learner` fails the role check before reaching any ownership check. Correct-answer field-stripping on `Question.content` (`02-api-contract.md` §4.4) prevents seeing answers before submitting, contingent on correct implementation — flagged as a priority unit test.

### 3.5 Denial of Service

**Gap reopened and closed.** `POST /attempts` was deliberately left unthrottled in Step 3, reasoning that throttling would punish fast legitimate learning and grading is server-side so spamming doesn't improve outcomes. Re-examined explicitly under this step's adversarial lens rather than re-accepted by default: the original reasoning addressed "don't punish fast learners," but never asked "what's the worst a malicious script could do" with the same intensity.

**Fix:** 60/min per-account backstop. Set deliberately far above plausible human throughput — even an extremely fast learner clicking through trivial questions tops out around one attempt every 2-3 seconds, roughly 20-30/min — so the limit only ever catches scripted abuse, never genuine speed. See `03-security-architecture.md` Section 4.2.

### 3.6 Elevation of Privilege
No gap. `learner`'s only write surface in the entire contract is `POST /attempts`, which carries no privilege implication. No path exists to self-enroll, self-remove from a cohort, or otherwise touch `Cohort`/`CohortEnrollment` — both are `instructor`(ownership)/`admin` only.

---

## 4. Actor 3 — Instructor

The richest actor overall: real write access to content and cohorts, gated almost entirely by the ownership-check pattern from Step 3. This actor's threat model is largely a stress test of that one mechanism.

### 4.1 Spoofing
No gap — same token-forgery analysis as Learner, no role-specific new surface.

### 4.2 Tampering

**No gap, pending implementation correctness:** Instructor A editing Instructor B's course content is prevented by `requireCourseOwnership`, applied to every Group 2 write including nested creates. This is flagged as a real implementation risk worth dedicated tests — `04-application-architecture.md` already named the upward-hierarchy resolvers as "real, slightly tedious... easy to get subtly wrong if rushed."

**No gap:** Cross-instructor cohort tampering prevented by `requireCohortOwnership`, same correctness caveat.

**Gap found and closed — `Question` had no owner at all.** Any instructor/admin could edit any question regardless of which course(s) it was attached to, since `Question` carried no ownership concept whatsoever.

**Why this is harder than `Course` ownership:** a `Question` can be attached to multiple courses owned by different instructors simultaneously — the entire point of the M:N reusability designed in Step 1. There's no single parent to inherit ownership from.

**Fix:** added `Question.created_by_id`. Edit/delete access is defined as creator **OR** any instructor who has attached the question to one of their own courses — deliberately broader than simple ownership, confirmed twice rather than accepted by default:

- *First confirmation:* should reuse grant broader edit rights, or restrict to creator-only? **Broader** was chosen — anyone relying on a shared question can fix it without needing the original author's permission.
- *Second confirmation, on deletion specifically:* given this means any one of them can also silently break it for the others (cascade-detach, no pre-check, no warning), is that still acceptable? **Confirmed yes**, accepting the risk explicitly rather than by default.

**Accepted tradeoff, stated plainly:** this is a shared-mutable-resource risk. Instructor B editing a question changes what Instructor A's students see too, since it's the same row, shared by reference. The upside (no single point of failure if the original author becomes unreachable) was judged to outweigh this, but the risk is real and now documented, not accidental.

**No gap:** instructors have zero write access to `Attempt` or grading data for any student, their own or others' — no endpoint exists for it.

### 4.3 Repudiation
Not separately analyzed — content-authoring actions aren't currently logged beyond standard timestamps (`created_at`/`updated_at`), which is sufficient for this actor; full action attribution is reserved for the admin-bypass cases covered by `AuditLog` (Section 6).

### 4.4 Information Disclosure

**No gap, pending implementation correctness:** cross-instructor visibility into cohort rosters/dashboards prevented by the same ownership checks as Tampering.

**Gap found and closed — cross-course attempt history disclosure.** The original `requireStudentOwnership` check (`03-security-architecture.md` §3.4) was a binary "does any teaching relationship exist" check, with no course scoping. This meant an instructor connected to a student through *one* cohort/course could see that student's attempt history across **every** course they're taking — including courses with zero connection to that instructor. A student's performance in an unrelated course is private data the instructor has no legitimate reason to see; "I teach you Hardware" doesn't justify visibility into Algorithms.

**Why this slipped through Step 3:** the check was designed to answer "can this instructor see this student's data at all" — course-scoping was never asked because nothing in Steps 1–3 surfaced a scenario where one student's data spans courses an instructor has no connection to. Not a mistake in the original design — a different question being asked at the time, which is exactly why this step exists.

**Fix:** `courseId` is now **required** (not optional) for `instructor` callers on `GET /attempts?userId=:id`. Access requires both (a) a teaching relationship via `CohortEnrollment`, **and** (b) the student having a `Progress` row for the *specific* `courseId` requested. This closes the cross-course leak without requiring a new `Cohort`-to-`Course` schema link (explicitly considered and declined — would solve a more precise problem than what's needed, given `Cohort` was already deliberately designed to span multiple courses). The looseness that remains is named explicitly: this checks two independent facts, not one formally connected fact — accepted as the most honest model available without new schema. See `02-api-contract.md` Section 5.2.

### 4.5 Denial of Service

**No gap, reasoning re-validated rather than reused by analogy.** Content-authoring endpoints remain unthrottled — the "small trusted group" reasoning from Step 3 was re-examined fresh rather than assumed to transfer: `POST /attempts` is reachable by potentially every learner (a large, low-trust population), while content-authoring is reachable only by a handful of named, accountable instructors/admins. The premise that justified skipping a limit for `POST /attempts` would *not* have held — and didn't, since that limit was reinstated in Section 3.5 — but it does hold here, for a genuinely different reason specific to this actor's smaller population.

**No gap:** the expensive two-junction-table-path `Question` edit-access check (Section 4.2) was considered for a dedicated rate limit and declined — same small-trusted-caller reasoning, and the target is a single named resource per request, not a broad enumerable surface.

### 4.6 Elevation of Privilege

**No gap:** no endpoint exists for self-promotion to `admin`; role changes only happen via the out-of-band seed script.

**No gap, confirmed by deliberately trying to break it:** the `POST /cohorts` admin-only `instructorId` carve-out only reads that field when `caller.role == 'admin'` — for an `instructor` caller it's silently ignored regardless of what's sent. Sending it has zero effect.

**No gap:** the new, broader `Question` edit-access grant was checked against whether it provides a backdoor into anything beyond the `Question` row itself. It grants no path to the `Screen`/`PracticeSet` it's attached to, nor the `Course` hierarchy above that — the blast radius is exactly the shared-mutable-resource risk already accepted in 4.2, not a wider escalation.

---

## 5. Actor 4 — Admin

Structurally different from Actors 1–3: admin bypasses every ownership check by design. Most of this actor's analysis isn't "can they get around a check" — there's no check to get around — it's **"is the bypass itself appropriately scoped, or does it grant more than intended."**

### 5.1 Spoofing
No gap — same token analysis as every other actor.

### 5.2 Tampering

Admin modifying any `Course`/`Cohort`/`Question`/enrollment by design is not a gap — it's the role's specification. The real question checked: does the ownership bypass accidentally also bypass *validation*, not just ownership?

**Clarified, not a gap — but worth a standing rule.** Confirmed: admin requests still pass through the same `validateBody`/Zod schema validation as any other caller; only ownership checks are skipped. **New standing rule, made explicit:** the admin bypass applies exclusively to ownership questions ("does this admin own this specific resource" — meaningless for a platform-wide role) and never to role checks or input validation ("is this request well-formed" — a question that doesn't become meaningless just because the caller is trusted). Recorded explicitly in `03-security-architecture.md` Section 3.6 specifically because "admin is trusted" is the kind of reasoning a future implementer could over-apply by analogy to a new endpoint if the boundary isn't written down.

**No gap:** the `Cohort`-to-non-instructor assignment business-rule check (validating an admin-supplied `instructorId` actually has `role = 'instructor'`) is a validation question, not an ownership question, and runs for admin callers under the same rule just stated.

### 5.3 Information Disclosure
No gap — and a stronger guarantee than a role check could provide. `password_hash` and refresh token values are never serialized into *any* response, for *any* role — there's no bypass to exploit because there's no role for which this data is ever exposed in the first place.

### 5.4 Denial of Service
No gap. The cascading-delete blast radius is gated by `?confirm=true` uniformly, with no role-based exception — admin triggers the identical safeguard an instructor would.

### 5.5 Elevation of Privilege
Not directly applicable — there's no higher role to escalate to. The relevant reframed question — can legitimate admin action create a privilege-escalation path for someone else — was checked specifically against the `POST /cohorts`/`instructorId` carve-out and found to have no exploitable sequencing: the `400` role-validation check runs synchronously against the target's *current* role at call time, with no window for pre-staging access for an account that doesn't yet have it.

**Actor 4 summary:** the cleanest actor — no new gaps, but one important standing rule made explicit (Section 5.2) precisely because it's a distinction worth having written down rather than left implicit.

---

## 6. Actor 5 — Compromised/Malicious Admin Account

A categorical shift in framing. Actors 1–4 asked whether access control correctly enforces an *intended* boundary. This actor assumes the access control is working exactly as designed and the person operating within it is the threat. Every "no gap" recorded for Admin in Section 5 was really saying "admin can legitimately do this" — which is precisely what makes a compromised admin account dangerous: the defenses protecting against Actors 1–4 are useless against this actor *by definition*, since the attacker already holds the role.

### 6.1 Tampering — blast radius

Walking through the worst case plainly: a compromised admin session can delete every course (gated only by `?confirm=true`, which a malicious actor simply sets), reassign every cohort to themselves, delete cohorts to lock out instructors, or read/exfiltrate any data accessible via admin's universal access. **Nothing in the design prevents this — that's the literal definition of what "admin" means in this system, not a flaw.** Since RBAC's job is to define what admin *can* do, and this actor is an admin exercising exactly that, the entire defense against this actor has to come from outside the RBAC system.

**Fix — `AuditLog`, a new system.** A detection-and-recovery control, not a prevention control: it does not stop the actions above, it ensures they're traceable afterward — the difference between an unrecoverable mystery and an investigable, partially-recoverable incident.

**Design decisions, each confirmed deliberately rather than defaulted:**

- **Append-only, enforced at the database level** (`REVOKE UPDATE, DELETE ON audit_log FROM app_user`), not by application convention. A convention defends against bugs but not this actor — a compromised admin with database credentials isn't bound by what the existing codebase happens to contain, and could `DELETE FROM audit_log` directly. Revoking the privilege at the database level holds even under full application compromise.
- **Logged actions are scoped, not exhaustive:** `course.deleted`/`chapter.deleted`/`lesson.deleted` (highest blast radius), `cohort.instructor_reassigned` (the one action reassigning ownership to someone else), `cohort.deleted`, `user.role_assigned_via_seed_script` (privilege elevation itself). Chosen specifically as actions where the admin ownership-bypass is what makes them possible at all.
- **Resource ID stored as TEXT, not a typed FK** — a single table spanning resource types with mixed ID types (UUID/integer) can't have one strongly-typed reference, and a FK would actively break logging a resource's own deletion.

**Gap found and closed within this fix — the seed script.** `scripts/create-admin.js` runs entirely outside the HTTP application, with no controller to log through — meaning the single most security-relevant action in the system (assigning an elevated role) would have had zero audit trail. Fixed by having the script write its own `AuditLog` entry directly, using the same database connection it already holds, attributing `user_id` to the *newly created account* (consistent with every other entry's meaning) and the operator's shell username to `metadata` (a weaker, unverified signal, kept separate from the verified `user_id` field).

### 6.2 Information Disclosure

Same root cause as Tampering — universal read access means a compromised admin can exfiltrate anything, and no technical control in this system's scope prevents it.

**Gap identified, deliberately accepted, not silently scoped out.** `AuditLog` as designed covers writes only. Mass data exfiltration via legitimate `GET` requests (e.g. systematically reading every cohort's roster) leaves no trace at all. Considered extending to sensitive reads and declined: for a small academic deployment with one or a handful of named admins, logging every sensitive `GET` was judged disproportionate cost/noise against a threat that's more theoretical than practical at this scale — the realistic failure mode is more likely a sudden, visible incident (a deleted course) than quiet long-term scraping. Revisit if this deployment ever grows past a handful of trusted admins.

### 6.3 Denial of Service
Same root cause as 6.1 — viewed through a different STRIDE lens, not a separate finding. No additional mitigation beyond the audit log's traceability.

### 6.4 Elevation of Privilege
Not applicable in the form it took for other actors — this actor already holds the maximum role. The relevant version of the question (can this actor's actions create privilege paths for someone else) was already checked and closed under Admin (Section 5.5).

**Actor 5 summary:** by far the most structurally distinct actor. RBAC cannot defend against it by definition; the entire mitigation is a new detection-and-recovery system (`AuditLog`), built with its own deliberate scoping decisions, plus one previously-invisible gap (the seed script) closed within that same fix.

---

## 7. Consolidated Findings

| # | Actor | Finding | Resolution |
|---|---|---|---|
| 1 | Outsider | Email enumeration via signup `409` | **Accepted** — low severity, doesn't aid account takeover |
| 2 | Learner | `userId` derivation on `POST /attempts` only implied, not stated | **Documentation fix** — now explicit in `02-api-contract.md` §5.3 |
| 3 | Learner | XP farming via repeated correct answers | **Closed** — XP awarded once per (user, question), on first correct attempt |
| 4 | Learner | `POST /attempts` fully unthrottled | **Closed** — 60/min per-account backstop added |
| 5 | Instructor | `Question` had no ownership concept at all | **Closed** — `Question.created_by_id` added; edit access = creator OR attached-to-owned-course |
| 6 | Instructor | `Question` deletion cascade-detaches with no warning | **Accepted, twice-confirmed** — shared-mutable-resource risk, documented |
| 7 | Instructor | Cross-course attempt-history disclosure via binary ownership check | **Closed** — `courseId` now required for instructor callers, scoped via `Progress` existence |
| 8 | Admin | Ownership bypass scope vs. validation bypass scope, previously implicit | **Clarified** — new standing rule, `03-security-architecture.md` §3.6 |
| 9 | Compromised Admin | No technical prevention possible by definition | **Mitigated (not prevented)** — new `AuditLog` system, database-enforced append-only |
| 10 | Compromised Admin | Seed script bypasses all logging entirely | **Closed** — script writes its own audit entry |
| 11 | Compromised Admin | Audit log covers writes only, not reads | **Accepted** — disproportionate cost/noise at this deployment's scale |

**Four genuine, previously-unexamined gaps closed** (#3, #5, #7, #10); **one entirely new system introduced** (`AuditLog`, #9); **one standing rule clarified** (#8); **three risks explicitly accepted** with documented reasoning rather than left as silent oversights (#1, #6, #11); **one documentation-only fix** (#2).

---

## 8. Schema and Contract Amendments Produced During This Step

For cross-reference against the documents already updated to reflect these:

| Addition | Where specified |
|---|---|
| `Question.created_by_id` (new column) | `01-data-model.md` §2–3, `02-api-contract.md` §4.5, `03-security-architecture.md` §3.4 Variant D |
| `AuditLog` (new table, database-enforced append-only) | `01-data-model.md` §3, `03-security-architecture.md` §8 |
| `GET /audit-log` (new endpoint, Group 7) | `02-api-contract.md` §8 |
| `POST /attempts` — `userId` derivation now explicit; XP-on-first-correct-attempt rule; `xpAwarded` field in response | `02-api-contract.md` §5.3 |
| `GET /attempts`/`GET /progress` — `courseId` required for instructor callers | `02-api-contract.md` §5.2 |
| `PATCH`/`DELETE /questions/:id` — ownership-equivalent access, not just role check | `02-api-contract.md` §4.1–4.5 |
| `POST /attempts` rate limit: None → 60/min per account | `03-security-architecture.md` §4.2 |
| Standing rule: admin ownership-bypass never extends to validation | `03-security-architecture.md` §3.6 |
| Audit-logging pattern: written by the service performing the action | `04-application-architecture.md` §1.1 |

---
