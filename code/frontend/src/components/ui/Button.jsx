import { Loader2 } from "lucide-react";
import "./Button.css";

// One primary CTA per screen (impeccable's product register guidance) -- variant is the caller's
// responsibility to use sparingly, not something this component enforces.
export function Button({
  variant = "primary",
  isLoading = false,
  disabled = false,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      className={["button", `button--${variant}`, className].filter(Boolean).join(" ")}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Loader2 className="button__spinner" size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
