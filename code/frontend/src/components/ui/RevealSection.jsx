import { useInViewOnce } from "../../hooks/useInViewOnce.js";

// Extracted from LandingPage.jsx (Phase 5.5) -- was defined locally there and used 4 times on
// that one page; the Dashboard/Catalog/Course-Detail redesigns want the exact same "observe once,
// add --visible on entry" wiring rather than a second implementation of it. Relies on global.css's
// existing .scroll-reveal/.scroll-reveal--visible rules (already loaded everywhere via main.jsx),
// so this needed no CSS of its own. `as` lets non-landing screens use a plain <div> instead of a
// marketing-page-shaped <section>.
export function RevealSection({ as: Tag = "section", id, className, children }) {
  const [ref, isInView] = useInViewOnce();
  return (
    <Tag
      id={id}
      ref={ref}
      className={[className, "scroll-reveal", isInView && "scroll-reveal--visible"]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
