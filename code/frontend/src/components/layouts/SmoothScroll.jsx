import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";

// Request: "make scrolling feel like butter." global.css's `scroll-behavior: smooth` only ever
// affected anchor-link/programmatic jumps -- it does nothing for ordinary wheel/trackpad/touch
// scrolling, which is the actual everyday scrolling experience and has no native easing at all on
// most desktop input. Lenis (named explicitly in this project's own impeccable skill as the
// accepted choice for "more advanced motion needs") adds real inertia/easing to that continuous
// scrolling. Disabled entirely under reduced motion -- same convention as every other continuous
// animation in this app -- falling back to plain, un-eased native scrolling, not a gentler
// substitute.
export function SmoothScroll() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    // duration/easing chosen to match this app's own --ease-out family (a cubic ease-out, no
    // bounce/elastic -- tokens.css's own --ease-out is cubic-bezier(0.16, 1, 0.3, 1), a steeper
    // curve than plain cubic easing can express, but the same "fast start, gentle settle"
    // character) rather than reaching for Lenis's own default linear-ish curve.
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });

    let frameId;
    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    // In-page anchor links (the landing page's #courses/#start-anywhere/#method nav) would
    // otherwise still use the browser's native instant hash-jump, which Lenis doesn't intercept on
    // its own -- routed through Lenis's own animated scrollTo instead so every scroll on the page,
    // not just wheel/touch, gets the same buttery feel. scroll-margin-top on the target sections
    // (LandingPage.css) keeps them clear of the fixed navbar; Lenis reads that automatically.
    function handleAnchorClick(event) {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const targetId = anchor.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target);
    }
    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return null;
}
