import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./AuthenticatedLayout.css";

// Purely a structural shell for now -- real session gating (redirect to /login if logged out)
// is ProtectedRoute's job, added in Frontend Milestone 2 once AuthContext exists.
export function AuthenticatedLayout() {
  const location = useLocation();
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

  return (
    <div>
      <nav>{/* nav placeholder -- built out alongside the design system in Milestone 2 */}</nav>
      {welcomeName ? (
        <p className="authenticated-layout__welcome-toast" role="status">
          Account created — welcome, {welcomeName}.
        </p>
      ) : null}
      <Outlet />
    </div>
  );
}
