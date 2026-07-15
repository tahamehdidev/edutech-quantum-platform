import { QubitMark } from "./LandingLogo.jsx";
import "./AuthShowcase.css";

// Shared between Login/Signup (two concrete, simultaneous instances of the identical panel --
// same justification as AuthPage.css's own shared-file split). Site-wide tokens only (--color-*),
// not LandingTheme.css's --landing-* namespace -- this is the app shell, not the marketing page,
// so it themes the same way every other authenticated screen does.
//
// Reworked to match a reference layout the user supplied directly (a light warm-gradient panel,
// logo top-left, lede + bold heading bottom-left, no illustration in between) -- previously a dark
// charcoal panel with a static sphere echo. Gradient stops stay inside this app's own Pumpkin
// anchor rather than the reference's literal colors, verified for contrast against the dark
// charcoal text below (see AuthShowcase.css).
export function AuthShowcase() {
  return (
    <aside className="auth-showcase" aria-hidden="true">
      <span className="auth-showcase__wordmark">
        <QubitMark className="auth-showcase__mark" />
        Qubit <span className="auth-showcase__affiliation">— NUST</span>
      </span>
      <div className="auth-showcase__copy">
        <p className="auth-showcase__lede">Not a diagram — a real quantum state.</p>
        <p className="auth-showcase__heading">See the qubit before you compute with it.</p>
      </div>
    </aside>
  );
}
