// Explicit /vitest entrypoint (not the plain "@testing-library/jest-dom" import), since it hooks
// into Vitest's own expect rather than assuming a global `expect` -- this project doesn't enable
// vitest's `globals: true`, so test files import `test`/`expect` explicitly (App.test.jsx).
import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react normally registers this cleanup itself, but only when it detects a
// global `afterEach` -- which doesn't exist here, for the same globals:false reason as above.
// Without it, a component rendered in one test stays mounted (with its effects still running)
// into the next test, since nothing ever unmounts it.
afterEach(() => {
  cleanup();
});

// jsdom does not implement HTMLDialogElement.showModal()/close() at all (as opposed to a
// partial/stubbed implementation) -- every real browser supports both, so this is a test-
// environment gap, not something Modal.jsx should defensively code around. Same category as the
// common matchMedia/ResizeObserver polyfills every jsdom test setup needs.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom does not implement window.matchMedia at all -- first needed by useReducedMotion.js
// (Frontend Milestone 5's landing-page hero). Defaults to "no preference matches" (matches:
// false) so any test not specifically exercising a media-query branch gets a sane baseline;
// individual tests still override window.matchMedia directly when they need to simulate a
// specific query result (see LandingHeroVisual.test.jsx/useReducedMotion.test.js).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = function matchMedia(query) {
    return {
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// jsdom does not implement IntersectionObserver at all -- same category of gap as matchMedia
// above, first needed by useInViewOnce.js (Frontend Milestone 5's landing-page scroll-reveal).
// A no-op stub: it never actually fires, matching this project's convention of accepting real
// browser-only behavior as untestable-in-jsdom rather than faking real intersection geometry.
// Tests exercising useInViewOnce capture the callback passed to `observe` themselves (see
// useInViewOnce.test.js) and invoke it directly to simulate an intersection.
if (typeof window !== "undefined" && !window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom does not implement ResizeObserver at all -- same category of gap as matchMedia/
// IntersectionObserver above. First needed by the real (unmocked) `lenis` package, which
// SmoothScroll.jsx constructs on every App render -- previously only BlochSphereScene's own gap
// was worked around by mocking that one component in each consuming test; this stub covers any
// component/library that touches ResizeObserver instead of requiring a mock per call site.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
