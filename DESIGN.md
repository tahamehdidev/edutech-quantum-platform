# Design

Seeded pre-implementation (no CSS/components existed yet) from a concrete `ui-ux-pro-max` pass, not from a blind five-question default. Re-run `/impeccable document` once the component library exists to capture the real, as-built tokens.

## Visual Theme

Dark-mode-first, calm "precision scientific instrument" aesthetic. Explicitly not neon-cyberpunk/HUD-glow (reads as sci-fi costume, not real physics) and not playful/rounded/childish edtech (undercuts credibility). WCAG AA minimum; this doubles as a study surface for long, single-sitting lesson sessions, so sustained readability wins over a punchy first impression.

Color strategy: **restrained**, not drenched — tinted dark neutrals carry the surface, with one calm accent (not a saturated brand wash) and clearly separated semantic colors for answer states and gamification, so those never get confused with the base UI palette.

## Color Palette

Base: "Space Tech / Aerospace" (credible, not neon — "star white + launch blue"), extended with two semantic tokens the base palette doesn't carry.

| Token | Value | Use |
|---|---|---|
| `--color-background` | `#0B0B10` | App background |
| `--color-foreground` | `#F8FAFC` | Primary text on background |
| `--color-card` | `#1E1E23` | Elevated surface (cards, panels) |
| `--color-muted` | `#232328` | Subtle fills, disabled backgrounds |
| `--color-muted-foreground` | `#94A3B8` | Secondary/de-emphasized text |
| `--color-border` | `#1E293B` | Dividers, input borders |
| `--color-accent` | `#3B82F6` | Primary interactive color (links, primary buttons, focus) |
| `--color-on-accent` | `#FFFFFF` | Text/icons on accent fill |
| `--color-ring` | `#F8FAFC` | Focus ring |
| `--color-destructive` | `#EF4444` | Incorrect answers, destructive actions, errors |
| `--color-success` | `#22C55E` | Correct answers, success confirmations |
| `--color-warning` | `#F59E0B` | XP/streak indicators, cautionary states |

Semantic answer-state colors (`--color-success` / `--color-destructive`) are reserved *only* for correct/incorrect feedback and destructive actions — never reused as decorative accents, so their meaning stays unambiguous (color is never the only signal either; pair with an icon/text per WCAG `color-not-only`).

## Typography

"Developer Mono" pairing — contrast axis is mono vs. humanist sans, not two similar sans-serifs.

- **JetBrains Mono** — headings, equations, gate/qubit notation, code-like content, the Bloch sphere widget's mode/parameter labels.
- **IBM Plex Sans** — body prose, lesson explanation text, UI chrome (buttons, nav, form labels). Chosen specifically for sustained technical-reading comfort over a generic UI sans, since lesson prose is read at length.

Type scale, weights, and line-heights are specified in `tokens.css` (built next via `/impeccable craft`).

## Components

None exist yet — `Card`, `Button`, `ProgressBar`, `Modal`, `QuestionRenderer` (dispatcher only), `XpStreakBadge` are the first component-library pass (Frontend Milestone 2), built directly against `tokens.css`. Re-run `/impeccable document` after that to capture the as-built system here.

## Layout

Standard responsive breakpoints (375 / 768 / 1024 / 1440). Spacing/radius/shadow/motion scales are defined in `tokens.css`. Motion should stay calm and functional (state-transition feedback, not decorative) — matches the "precision instrument," not "playful app" personality from `PRODUCT.md`.
