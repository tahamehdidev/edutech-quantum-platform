import { useState, useEffect } from "react";
import { BlochSphereScene } from "../components/widgets/BlochSphereScene.jsx";
import { probabilityOf0 } from "../components/widgets/blochPhysics.js";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import "./LandingHeroVisual.css";

// A slow, calm idle drift -- not a spin. Long periods on purpose: this is standing in for a hero
// photograph (docs' own "imagery" requirement for a brand-register page), and a fast-moving
// centerpiece would read as flashy, contradicting the "precision instrument" personality.
const ROTATION_PERIOD_MS = 26_000; // one full azimuthal orbit
const BREATH_PERIOD_MS = 18_000; // theta drifts between two bounds and back
const THETA_MIN = Math.PI / 3;
const THETA_MAX = (2 * Math.PI) / 3;

// The frame shown whenever the arrow isn't animating (prefers-reduced-motion, or WebGL isn't
// available at all) -- a three-quarter angle, not a pole. A pole would look like the visual is
// broken/empty rather than deliberately static.
const STATIC_THETA = Math.PI / 2.4;
const STATIC_PHI = Math.PI / 4;

function isWebglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// Purely decorative hero centerpiece (aria-hidden -- there's no information here to give an
// accessible alternative for, unlike e.g. AmplitudeBarChart's chart-plus-data-table split). Reuses
// BlochSphereScene (the tested 3D rendering piece from Milestone 4's widget) but is deliberately
// its own component, not a mode of the real BlochSphere widget -- this is marketing atmosphere,
// never tied to a Question/Screen's content, and mixing that concern into the lesson widget's
// mode-dispatch system would conflate two different things.
export function LandingHeroVisual() {
  const prefersReducedMotion = useReducedMotion();
  const [webglAvailable] = useState(isWebglAvailable);
  const [angles, setAngles] = useState({ theta: STATIC_THETA, phi: STATIC_PHI });
  // Once a visitor drags the sphere, the ambient drift stops for good rather than fighting the
  // user's own placement on the next frame -- a curious first-touch discovery (this is the same
  // arrow-on-a-sphere interaction the real lesson widget uses) takes priority over the idle-photo
  // behavior once it's been used.
  const [hasInteracted, setHasInteracted] = useState(false);

  function handleDrag(newAngles) {
    setAngles(newAngles);
    setHasInteracted(true);
  }

  useEffect(() => {
    // Reduced motion, no WebGL, or the visitor already took the wheel all mean "show a still
    // frame and do nothing else" -- no rAF loop is ever (re-)started, not just a fast/instant
    // version of one.
    if (prefersReducedMotion || !webglAvailable || hasInteracted) return;

    let cancelled = false;
    let isPaused = document.hidden;
    // A single wireframe sphere + one arrow is cheap enough that frame budget was never really
    // the concern for "low-end devices" -- the actual cost of a perpetual rAF loop is battery/CPU
    // for a tab nobody's looking at, which this avoids regardless of device class.
    function handleVisibilityChange() {
      isPaused = document.hidden;
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const start = performance.now();
    function step(now) {
      if (cancelled) return;
      if (!isPaused) {
        const elapsed = now - start;
        const breathT = (Math.sin((elapsed / BREATH_PERIOD_MS) * 2 * Math.PI) + 1) / 2;
        setAngles({
          theta: THETA_MIN + breathT * (THETA_MAX - THETA_MIN),
          phi: ((elapsed / ROTATION_PERIOD_MS) * 2 * Math.PI) % (2 * Math.PI),
        });
      }
      requestAnimationFrame(step);
    }
    const frameId = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [prefersReducedMotion, webglAvailable, hasInteracted]);

  if (!webglAvailable) {
    return <StaticSphereIllustration className="landing-hero-visual__fallback" />;
  }

  // Real numbers from the same physics module the lesson widget uses, not a decorative fake --
  // once someone drags the arrow they're reading the actual quantum-state probabilities for
  // wherever they left it. probabilityOf0 rounds cleanly; probabilityOf1 is derived as the
  // complement so the two always sum to exactly 100% (independent rounding could read 99/101).
  const probabilityOfZero = Math.round(probabilityOf0(angles.theta) * 100);
  const probabilityOfOne = 100 - probabilityOfZero;

  return (
    <div className="landing-hero-visual">
      {/* aria-hidden: dragging the arrow conveys no information a screen-reader user would be
          missing (it's a discoverable easter egg, not a functional control -- the real Bloch
          sphere widget with full keyboard/labelled controls lives in the lesson player). */}
      <div className="landing-hero-visual__scene" aria-hidden="true">
        <BlochSphereScene
          theta={angles.theta}
          phi={angles.phi}
          arrowColor="#438bff"
          draggable
          onDrag={handleDrag}
        />
      </div>
      <p
        className={
          "landing-hero-visual__readout" +
          (hasInteracted ? " landing-hero-visual__readout--visible" : "")
        }
        aria-hidden="true"
      >
        P(|0⟩) ≈ {probabilityOfZero}% · P(|1⟩) ≈ {probabilityOfOne}%
      </p>
    </div>
  );
}

// A static SVG echo of the same wireframe-sphere-plus-arrow motif, for the rare case WebGL isn't
// available at all -- so the fallback still reads as "the same visual, just not moving," not an
// empty box or an unrelated placeholder.
function StaticSphereIllustration({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" fill="none" stroke="#61728f" strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="80" ry="24" fill="none" stroke="#61728f" strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="24" ry="80" fill="none" stroke="#61728f" strokeWidth="1" />
      <line x1="100" y1="180" x2="100" y2="20" stroke="#61728f" strokeWidth="1" />
      <line
        x1="100"
        y1="100"
        x2="152"
        y2="52"
        stroke="#438bff"
        strokeWidth="2.5"
        markerEnd="url(#landing-hero-arrowhead)"
      />
      <defs>
        <marker
          id="landing-hero-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#438bff" />
        </marker>
      </defs>
    </svg>
  );
}
