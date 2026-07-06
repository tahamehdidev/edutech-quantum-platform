# Product

## Register

product

## Users

STEM learners with basic programming/math background but no prior linear algebra or quantum mechanics — studying independently, often in longer, focused sessions working through a whole lesson's sequential screens. Secondary users: instructors managing cohorts and reviewing completion/pacing dashboards; admins doing platform oversight and audit review. The primary job to be done: build genuinely correct conceptual understanding of quantum computing topics (QML, quantum algorithms, quantum hardware) through visual/intuitive explanations first, formal notation gradually — not to collect gamification badges for their own sake.

## Product Purpose

Teaches Quantum Machine Learning, Quantum Algorithms, and Quantum Computing Hardware through a Duolingo-esque lesson player (sequential explanation/simulation/question screens), shared interactive widgets (Bloch sphere, topology diagram, amplitude bar chart, drag-to-order, MCQ, numeric input), practice sets, and a light XP/streak gamification layer — so a STEM learner without prior quantum-mechanics background can build real, correct intuition, not just progress through gamified checkpoints. Success looks like a learner who can explain a concept in plain language after a lesson, not just one who cleared a screen.

## Brand Personality

Rigorous, calm, precise. A serious technical education tool with a light, non-distracting gamification layer — gamification is never the identity, the physics content is.

## Anti-references

- Duolingo-style cartoon-mascot cuteness (undercuts credibility for genuinely technical content).
- Generic gray/blue SaaS dashboard blandness (reads as a template, not a purpose-built teaching tool).
- Neon-cyberpunk/sci-fi cliché (a "hacker HUD" aesthetic misrepresents quantum computing as costume sci-fi rather than real, teachable physics).

## Design Principles

- **Correctness before charm.** Any visual flourish that undercuts scientific credibility is wrong, no matter how polished — this platform's whole value proposition depends on being taken seriously as a technical teaching tool.
- **Show, then formalize.** The courses' own pedagogy is visual/intuitive first, formal notation gradual. The UI should mirror this sequencing rather than front-loading density or jargon.
- **Gamification is seasoning, not the meal.** XP/streak indicators are a calm, secondary signal — they should never visually compete with the content itself.
- **One instrument, not a toy.** The Bloch sphere and other simulations must read as precise scientific instruments. Their chrome reinforces that this is real physics being manipulated, not a decorative interactive toy.
- **Long-session comfort.** A lesson session runs through many sequential screens in one sitting — sustained readability and low eye strain matter more than a punchy first-impression look.

## Accessibility & Inclusion

WCAG AA minimum (a stated project target — contrast ratios must be verified against AA before any later polish pass). Full keyboard navigation required, including a keyboard-operable alternative for the drag-to-order widget specifically. `prefers-reduced-motion` must be respected throughout. The Bloch sphere's non-visual controls (mode switcher, gate buttons, sliders) need real screen-reader labels — the 3D canvas itself is inherently non-accessible, so the surrounding chrome is where accessibility for that widget actually lives.
