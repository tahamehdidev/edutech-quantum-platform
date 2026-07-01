# EduTech Quantum Platform — Seed Data

**Status:** Finalized — Step 4 of content design
**Generated:** June 2026

---

## Overview

Three JSON files, one per course, containing fully structured seed data ready to be loaded into the database.

| File | Course | Chapters | Lessons | Screens | Inline Questions | Practice Questions |
|---|---|---|---|---|---|---|
| `seed_course_qml.json` | Quantum Machine Learning | 6 | 25 | 118 | 35 | 29 |
| `seed_course_algorithms.json` | Quantum Algorithms | 6 | 24 | 106 | 37 | 40 |
| `seed_course_hardware.json` | Quantum Computing Hardware | 6 | 22 | 89 | 33 | 37 |

---

## JSON Structure (per file)

```
Course
  .title         — string
  .narrative     — string
  .created_by_id — UUID (sentinel, replace with real admin UUID at seed time)
  .chapters[]
    .order_index  — int
    .title        — string
    .lessons[]
      .order_index    — int
      .title          — string
      .screens[]
        .order_index  — int
        .type         — "explanation" | "question" | "simulation"
        .content      — see below
        .question_ref — int (question ID, present only on type="question" screens)
      .inline_questions[]   — Question rows for screens embedded in this lesson
        .id                 — int
        .prompt             — string
        .type               — "mcq" | "drag_drop" | "numeric"
        .content            — see below
        .created_by_id      — UUID (sentinel)
      .practice_sets[]
        .id        — int
        .title     — string
        .questions[]
          .order_index — int
          .question    — Question row (same shape as inline_questions)
```

## Content Shapes (matches `03-security-architecture.md` Zod schemas exactly)

### Screen.content
```json
// explanation
{ "text": "Learner-facing prose..." }

// question
{}  // passthrough — content lives on the Question row via question_ref

// simulation
{ "widgetType": "bloch_sphere" | "amplitude_bar_chart" | "topology_diagram" | "quadrant_selector" | "basis_encoder",
  "params": { ... } }
```

### Question.content
```json
// mcq
{ "options": ["opt1", "opt2", "opt3", "opt4"], "correctOptionIndex": 2 }

// drag_drop
{ "items": ["step A", "step B", "step C"], "correctOrder": [2, 0, 1] }

// numeric
{ "correctValue": 1000000, "tolerance": 100000 }
```

---

## Loading Instructions

1. **Replace the sentinel UUID** (`00000000-0000-0000-0000-000000000001`) with the real admin user's UUID, created via `scripts/create-admin.js`.

2. **Load order:** Insert `Course` → `Chapter` → `Lesson` → `Screen`, then `Question` rows (both inline and practice set), then `ScreenQuestion` junction rows (pairing each question-type screen with its Question via `question_ref`), then `PracticeSet` rows, then `PracticeSetQuestion` junction rows.

3. **Practice set distractor options:** MCQ practice questions currently have `[Distractor A/B/C]` placeholder options. These are flagged with `"_note": "Distractor options require manual authoring before production use"` in their content object. The correct answer is always at index 0 — either add real distractors before loading, or load as-is and author them via the admin content tool post-deployment.

4. **Simulation widget params:** Bloch sphere params include `mode` (free_placement / gate_application / rotation_slider / measure_demo / t1_decay) and `availableGates` arrays — these are the input shape the frontend widget should accept. The Security Architecture doc (`03-security-architecture.md` §5.3) treats these as intentionally loose for now; tighten the schema once each widget's final implementation is known.

---

## What Is Not in These Files

- **User data** — no learner accounts, progress, attempts, or XP. Those are generated at runtime.
- **Cohort data** — no cohorts or enrollments.
- **Audit log entries** — generated at runtime.
- **Refresh tokens** — generated at runtime.
