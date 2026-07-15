import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./AuthenticatedLayout.css";

// Real navigation, not the placeholder it used to be (nav-flow audit) -- every authenticated
// screen previously had no persistent way to reach /courses, /dashboard, or log out at all,
// short of typing a URL directly. Reuses the app's own site-wide tokens, same restraint as
// everywhere else in this system.
export function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  // SignupPage passes this via navigate()'s state on a successful signup -- otherwise signing up
  // is a visual non-event (form disappears, catalog appears, nothing marks the transition). Lives
  // here rather than on CourseCatalogPage itself since "acknowledge how we got here" is a
  // route-agnostic shell concern, not that specific screen's job.
  const [welcomeName, setWelcomeName] = useState(location.state?.welcomeName ?? null);

  useEffect(() => {
    if (!welcomeName) return;
    const timeoutId = setTimeout(() => setWelcomeName(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [welcomeName]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div>
      <nav className="authenticated-layout__nav" aria-label="Main">
        {/* Critique fix: was a plain Link with hover-only color, no persistent indicator of
            current location -- sighted users had to read the page's own h1 to confirm where they
            were, screen-reader users got nothing. NavLink applies aria-current="page" on the
            active route automatically; the active modifier class adds the visible cue. */}
        <NavLink
          to="/courses"
          className={({ isActive }) =>
            "authenticated-layout__nav-link" +
            (isActive ? " authenticated-layout__nav-link--active" : "")
          }
        >
          Courses
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            "authenticated-layout__nav-link" +
            (isActive ? " authenticated-layout__nav-link--active" : "")
          }
        >
          Dashboard
        </NavLink>
        <button
          type="button"
          className="authenticated-layout__logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </nav>
      {welcomeName ? (
        <p className="authenticated-layout__welcome-toast" role="status">
          Account created — welcome, {welcomeName}.
        </p>
      ) : null}
      <Outlet />
    </div>
  );
}
