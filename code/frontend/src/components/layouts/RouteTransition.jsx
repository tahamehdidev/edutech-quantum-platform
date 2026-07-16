import { Outlet, useLocation } from "react-router-dom";
import "./RouteTransition.css";

// Task #24 (site-wide motion pass), route-to-route leg -- a from-scratch replacement for the
// RouteTransitionOverlay this project fully reverted earlier (that one used a separate JS-driven
// overlay component, synced via useEffect/useLayoutEffect against React Router's own render, which
// is exactly where the flicker came from: a real gap between "Routes already painted the new
// page" and "the overlay's effect noticed and reacted"). This has no JS timing to get wrong at
// all -- keying this div by pathname makes React unmount/remount it on every real navigation,
// which means the CSS `animation` below is present on the element from its very first paint,
// declared in a stylesheet loaded ages before any navigation ever happens. There is no window
// where the element exists without its animation, because there's no separate overlay racing
// against it -- only the persistent nav/chrome in AuthenticatedLayout/PublicLayout stays mounted
// outside this wrapper, so those never flicker either.
export function RouteTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-transition">
      <Outlet />
    </div>
  );
}
