import { BlochSphereScene } from "../components/widgets/BlochSphereScene.jsx";
import "./LandingHeroVisual.css";

// Feature-detected once by the parent (LandingPage) and passed down as a prop -- the parent also
// needs to know this to decide whether to render the readout in the hero copy column at all (no
// point showing "drag to see the numbers" state next to a static fallback illustration that can't
// be dragged).
export function isWebglAvailable() {
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
//
// A controlled, presentational component: LandingPage owns theta/phi, the ambient-idle-drift
// loop, and the drag/interaction state, since the P(|0>)/P(|1>) readout those numbers drive now
// lives in the hero copy column (under the tagline), not beside the sphere -- one shared owner
// for state two different parts of the hero need to read.
export function LandingHeroVisual({ webglAvailable, theta, phi, onDrag, onDragEnd, onKeyDown }) {
  if (!webglAvailable) {
    return <StaticSphereIllustration className="landing-hero-visual__fallback" />;
  }

  return (
    <div className="landing-hero-visual">
      {/* Critique fix: previously aria-hidden + mouse/touch-only, so a keyboard-only user (sighted
          or not) got none of the page's single biggest differentiator. Now focusable with a real
          label and arrow-key support (onKeyDown, wired from LandingPage's own handleHeroDrag/
          handleHeroDragEnd -- the same functions a mouse drag calls, not a parallel code path).
          Still not a form control with a meaningful "value" to expose via a live region -- that
          would be over-building a decorative easter egg into something heavier than the actual
          lesson-player widget's own equivalent mode currently has. */}
      {/* Soft ambient glow behind the canvas (::before on this wrapper, see CSS) -- a CSS-only
          radial blur, not a WebGL bloom pass, so it costs nothing extra to render. */}
      <div
        className="landing-hero-visual__scene"
        tabIndex={0}
        role="group"
        aria-label="Interactive qubit state sphere. Drag, or focus and use the arrow keys, to rotate it."
        onKeyDown={onKeyDown}
      >
        <BlochSphereScene
          theta={theta}
          phi={phi}
          arrowColor="#BB4200"
          wireframeColor="#7794A6"
          draggable
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />
        {/* Pole labels -- the real lesson widget (BlochSphere.jsx) has always had these; the
            landing hero never did, since it started as pure decoration. Individually aria-hidden
            now (the parent wrapper above no longer is, since it's a real focusable control) --
            the group's own aria-label already says what this is, so these would just be two
            redundant stray text nodes in the accessible tree otherwise. Still give sighted
            visitors the same "this is a real coordinate system" cue the actual teaching widget
            gives learners. */}
        <span
          className="landing-hero-visual__pole-label landing-hero-visual__pole-label--north"
          aria-hidden="true"
        >
          |0⟩
        </span>
        <span
          className="landing-hero-visual__pole-label landing-hero-visual__pole-label--south"
          aria-hidden="true"
        >
          |1⟩
        </span>
      </div>
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
      <circle cx="100" cy="100" r="80" fill="none" stroke="#7794A6" strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="80" ry="24" fill="none" stroke="#7794A6" strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="24" ry="80" fill="none" stroke="#7794A6" strokeWidth="1" />
      <line x1="100" y1="180" x2="100" y2="20" stroke="#7794A6" strokeWidth="1" />
      <line
        x1="100"
        y1="100"
        x2="152"
        y2="52"
        stroke="#BB4200"
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
          <path d="M0,0 L8,4 L0,8 Z" fill="#BB4200" />
        </marker>
      </defs>
    </svg>
  );
}
