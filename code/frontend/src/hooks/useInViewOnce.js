import { useState, useEffect, useRef } from "react";

// Fires once, never re-triggers on scroll-back-and-forth -- a section entrance is a one-time
// event, not a repeating one, so the observer disconnects itself the moment it reports true.
// threshold 0.15 (not 0/1) so the reveal starts once a meaningful fraction of the section is
// visible, not the instant a single pixel crosses the viewport edge.
export function useInViewOnce({ threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView];
}
