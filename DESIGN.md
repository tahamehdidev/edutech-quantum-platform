# Design

Seeded pre-implementation from a concrete `ui-ux-pro-max` pass; migrated site-wide (all screens, not just the landing page) to a new Pumpkin/Charcoal light identity in a dedicated foundation pass (tokens.css + shared component library first, screens second). Re-run `/impeccable document` once the screen-by-screen pass is complete to capture the final as-built system.

## Visual Theme

Light-mode, calm "precision scientific instrument" aesthetic, expressed through a Pumpkin/Charcoal palette (Pumpkin `#FE7F2D`, Charcoal `#233D4D`) rather than the original dark theme. Explicitly not neon-cyberpunk/HUD-glow (reads as sci-fi costume, not real physics), not playful/rounded/childish edtech (undercuts credibility), and not a cream/sand "AI default" warm-neutral body background (warmth comes from the Pumpkin accent, not the base surface). WCAG AA minimum; this doubles as a study surface for long, single-sitting lesson sessions, so sustained readability wins over a punchy first impression.

Color strategy: **restrained**, not drenched — tinted light neutrals (Charcoal-hued, low chroma) carry the surface, with one saturated accent (Pumpkin, ~10% of surface) and clearly separated semantic colors for answer states and gamification, so those never get confused with the base UI palette or each other.

## Color Palette

Two anchors (Pumpkin, Charcoal) extended via OKLCH into a full functional system. Every pairing below is WCAG-AA verified against both light surfaces (`--color-background` and `--color-card`) — see `tokens.css`'s own header comment for the full reasoning behind each value, including three places this diverges from the landing page's own literal numbers (`--color-border-strong`, `--color-accent-strong`, `--color-muted`) because the app's actual component usage (a tinted background, not pure white; a shared hover mechanism the landing page's own CTA doesn't use) demanded different margins.

| Token | Value | Use |
|---|---|---|
| `--color-background` | `#F2F8FC` | App background (tinted off-white) |
| `--color-foreground` | `#233D4D` | Primary text (literal Charcoal anchor) |
| `--color-card` | `#FFFFFF` | Elevated surface (cards, panels) |
| `--color-overlay` | `#FFFFFF` | Modals/popovers — same as card; elevation carried by `--shadow-lg` + backdrop scrim, not a third lightness tier |
| `--color-muted` | `#D1E5F2` | Subtle fills, disabled backgrounds |
| `--color-muted-foreground` | `#4C6779` | Secondary/de-emphasized text |
| `--color-border` | `#DDE6EC` | Decorative dividers only |
| `--color-border-strong` | `#6E8B9D` | Input/control outlines, 3:1+ verified |
| `--color-accent` | `#AD3400` | Links, icons, borders, progress fill |
| `--color-accent-strong` | `#B43B00` | Solid button/fill backgrounds |
| `--color-on-accent` | `#FFFFFF` | Text/icons on accent-strong fill |
| `--color-ring` | `#233D4D` | Focus ring (= `--color-foreground`) |
| `--color-destructive` | `#DB4241` | Icons/borders/fills, non-text (3:1) |
| `--color-destructive-text` | `#B00A1C` | Destructive-colored TEXT only |
| `--color-destructive-strong` | `#9B0005` | Solid destructive-button fills |
| `--color-success` | `#00621C` | Correct-answer text, icons, borders |
| `--color-caution` | `#005397` | Incorrect-but-retriable answer state only (deliberately a cool blue, tuned off the Charcoal anchor's own hue rather than an unrelated one — see `tokens.css`) |
| `--color-warning` | `#996700` | XP/streak icon (sits on `--color-muted`) |
| `--color-warning-strong` | `#D9A514` | XP-awarded pill fill, paired with `--color-on-warning` |
| `--color-on-warning` | `#233D4D` | Text on `--color-warning-strong` fill (= `--color-foreground`) |

Semantic answer-state colors (`--color-success` / `--color-destructive*` / `--color-caution`) are reserved *only* for their meaning — never reused as decorative accents, so their meaning stays unambiguous (color is never the only signal either; pair with an icon/text per WCAG `color-not-only`). `--color-caution` was deliberately moved off the warm hue family because the new brand accent now occupies the hue range the old caution color used to sit in — rather than inventing an arbitrary new hue, it's tuned directly off the Charcoal anchor's own hue (236.8), just with far more chroma than the neutral text tokens, so every color in the app traces back to one of the two brand anchors (Pumpkin/Charcoal) plus the two universally-expected error/success conventions.

## Typography

One pairing now, site-wide — migrated from the original IBM Plex Sans system to match the landing page's own pairing exactly, rather than keeping two separate type systems by register:

- **Bricolage Grotesque** (`--font-display`) — all headings (`h1`–`h6`) everywhere in the app, not just the landing page.
- **Public Sans** (`--font-sans`) — body prose, lesson explanation text, UI chrome (buttons, nav, form labels), replacing IBM Plex Sans in that role.
- **JetBrains Mono** (`--font-mono`) — unchanged throughout: equations, gate/qubit notation, code-like content, the Bloch sphere widget's mode/parameter labels. Never a headings font.

The landing page still uses its own fluid `clamp()` scale for its hero/section headings (`LandingTheme.css`'s `--landing-text-*` tokens) — that's a layout/scale decision tied to the hero's specific display sizes, not a font-family one, and stays scoped to the marketing page. Every other screen keeps the fixed-rem scale in `tokens.css`.

## Components

`Card`, `Button`, `ProgressBar`, `Modal`, `ConfirmDeleteModal`, `Input`, `QuestionRenderer` (dispatcher only), `XpStreakBadge`, plus the six widget components (Mcq, Numeric, DragDrop, TopologyDiagram, AmplitudeBarChart, BlochSphere/BlochSphereScene) and `AttemptFeedback`/`AttemptActions` — all built directly against `tokens.css` custom properties (no hardcoded colors), which is exactly what let the site-wide palette migration land as a single-file token change for nearly every component. Two hardcoded exceptions existed and were fixed as part of that migration: `BlochSphere.jsx`'s `arrowColor` prop and `BlochSphereScene.jsx`'s `wireframeColor` default were literal hex duplicates of the old `--color-accent`/`--color-border-strong` values (three.js material colors can't reference CSS custom properties directly) — both updated to the new hex values, same documented-duplicate pattern as before.

## Layout

Standard responsive breakpoints (375 / 768 / 1024 / 1440). Spacing/radius/shadow/motion scales are defined in `tokens.css`. Motion should stay calm and functional (state-transition feedback, not decorative) — matches the "precision instrument," not "playful app" personality from `PRODUCT.md`.
