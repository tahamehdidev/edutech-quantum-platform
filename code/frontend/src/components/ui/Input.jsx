import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./Input.css";

// First real text-input component in the library (Login/Signup are the first screens that need
// one) -- label always visible above the control, never placeholder-only (impeccable's product
// register: standard form-control vocabulary, no invented affordances). Focus styling comes from
// global.css's :focus-visible rule, not duplicated here.
//
// `hint` is a persistent requirement note (e.g. "At least 8 characters") shown under the control
// when there's no error -- an `error` on the same field replaces it rather than stacking both,
// since showing "must be 8+ characters" next to "Password must be at least 8 characters" would
// be redundant. Deliberately separate from `error`: a hint is always-visible guidance, not a
// validation result.
//
// A `type="password"` field also gets a show/hide toggle -- the one input on this form where a
// user commits a brand-new string to memory with no way to visually double-check it before
// submitting. Scoped to password fields only via the `type` prop, not a separate opt-in flag,
// so Email/Name inputs on the same forms are unaffected without any caller-side change.
export function Input({ label, error, hint, id, className = "", type, ...props }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = !error && hint ? `${inputId}-hint` : undefined;
  const isPassword = type === "password";
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={["field", className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <div className="field__control-wrapper">
        <input
          id={inputId}
          type={isPassword ? (isRevealed ? "text" : "password") : type}
          className={[
            "field__control",
            isPassword ? "field__control--has-toggle" : "",
            error ? "field__control--error" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId ?? hintId}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setIsRevealed((revealed) => !revealed)}
            aria-label={isRevealed ? "Hide password" : "Show password"}
            aria-pressed={isRevealed}
          >
            {isRevealed ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
