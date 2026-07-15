// Shared between LandingNavbar and LandingPage's footer -- a single source for the mark so both
// stay visually identical, rather than two hand-kept-in-sync copies of the same SVG.
//
// The glyph reuses the page's own real visual language (the Bloch sphere's own orbit-and-point
// motif from BlochSphereScene/StaticSphereIllustration) instead of an unrelated icon: an orbit
// ellipse around a circle, with a filled point marking a state on it -- literally a qubit, not a
// generic abstract mark.
export function QubitMark({ className }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="14" cy="14" r="10.5" stroke="currentColor" strokeWidth="1.75" />
      <ellipse
        cx="14"
        cy="14"
        rx="10.5"
        ry="4"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-18 14 14)"
      />
      <circle cx="22.3" cy="8.4" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function LandingWordmark({ className }) {
  return (
    <span className={["landing-wordmark", className].filter(Boolean).join(" ")}>
      <QubitMark className="landing-wordmark__mark" />
      <span className="landing-wordmark__text">
        Qubit <span className="landing-wordmark__affiliation">— NUST</span>
      </span>
    </span>
  );
}
