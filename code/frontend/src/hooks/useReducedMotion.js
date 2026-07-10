import { useState, useEffect } from "react";

// Every component so far only needed prefers-reduced-motion at the CSS level (tokens.css's
// @media block zeroes the duration tokens) -- this is the first case where a component needs to
// branch its own JS behavior on it (skip a requestAnimationFrame loop entirely, not just speed up
// a transition), so it's a real hook now rather than a premature one.
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    function handleChange(event) {
      setPrefersReducedMotion(event.matches);
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
