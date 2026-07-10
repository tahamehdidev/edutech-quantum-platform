import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card.jsx";
import { LandingHeroVisual } from "./LandingHeroVisual.jsx";
// Button.jsx itself always renders a real <button> (wrong semantics for pure navigation), so
// these CTAs are plain <Link>s wearing Button.css's classes instead -- but that CSS only loads
// when something imports it, and no <Button> component is ever mounted on this page. Explicit
// side-effect import, same as every component importing its own co-located CSS.
import "../components/ui/Button.css";
import "./LandingPage.css";

// One-stroke line icons distinguishing the three cards from each other (not decoration on top
// of an otherwise-identical repeated card) -- currentColor, matching the design system's single
// calm-accent "restrained" strategy rather than inventing a per-course color palette.
function NeuralNetIcon({ className }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="5" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="20" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="20" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 9.3 12.2 13 M7 18.7 12.2 15 M15.8 13 21 9.3 M15.8 15 21 18.7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AlgorithmIcon({ className }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="5" cy="14" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="23" cy="22" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.2 13 15 7 M15 7h6 M7.2 15 15 21 M15 21h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function QubitChipIcon({ className }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14 2v5 M14 21v5 M2 14h5 M21 14h5 M5.5 5.5l3.5 3.5 M19 19l3.5 3.5 M22.5 5.5 19 9 M9 19l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Core questions are quoted verbatim from docs/07-course-narratives-spine.md, not rewritten --
// each course is genuinely built around answering this one question, so it's the real, specific
// pitch rather than generic marketing copy standing in for it.
const COURSES = [
  {
    name: "Quantum Machine Learning",
    Icon: NeuralNetIcon,
    coreQuestion:
      'If a quantum computer can hold and transform exponentially more information than a classical bit register, can it learn patterns the way a neural network does — and what does "learning" even mean when the model is a quantum circuit?',
  },
  {
    name: "Quantum Algorithms",
    Icon: AlgorithmIcon,
    coreQuestion:
      "What can a quantum computer actually compute that a classical computer structurally cannot do efficiently — and why does that threaten the cryptography the entire internet currently relies on?",
  },
  {
    name: "Quantum Computing Hardware",
    Icon: QubitChipIcon,
    coreQuestion:
      "A qubit is a delicate physical thing, not just a mathematical symbol — so what does it actually take, physically, to build, control, and keep one alive long enough to compute anything useful?",
  },
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-page__hero">
        <div className="landing-page__hero-copy">
          <h1>See the qubit before you compute with it.</h1>
          <p className="landing-page__hero-subhead">
            Three rigorous courses in quantum machine learning, algorithms, and hardware — built for
            STEM learners who want real understanding, not just a certificate.
          </p>
          <div className="landing-page__hero-actions">
            <Link to="/signup" className="button button--primary">
              Start learning
            </Link>
            <Link to="/login" className="button button--secondary">
              Log in
            </Link>
          </div>
        </div>
        <LandingHeroVisual />
      </section>

      <section className="landing-page__courses">
        <h2>Three courses, one core question each.</h2>
        <div className="landing-page__course-grid">
          {COURSES.map((course) => (
            <Card key={course.name} className="landing-page__course-card">
              <div className="landing-page__course-card-heading">
                <course.Icon className="landing-page__course-card-icon" />
                <h3>{course.name}</h3>
              </div>
              <p className="landing-page__course-question">{course.coreQuestion}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-page__method">
        <h2>Formal notation comes later. The picture comes first.</h2>
        <p>
          Every concept starts as something you can see and manipulate — a qubit as a literal arrow
          on a sphere, a gate as a rotation you watch happen — before any bra-ket notation appears.
          The same interactive widgets, including a real Bloch sphere, carry through all three
          courses, so the mental model you build in the first lesson keeps paying off in the last.
        </p>
        <p>
          XP and streaks are here, but they stay in the background. The thing being measured is
          whether you can explain a concept afterward, not how many screens you cleared.
        </p>
      </section>

      <section className="landing-page__final-cta">
        <h2>Start with the first thing every course teaches: what a qubit actually is.</h2>
        <Link to="/signup" className="button button--primary">
          Create your account
        </Link>
      </section>
    </main>
  );
}
