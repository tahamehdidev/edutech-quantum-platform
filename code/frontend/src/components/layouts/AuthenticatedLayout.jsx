import { Outlet } from "react-router-dom";

// Purely a structural shell for now -- real session gating (redirect to /login if logged out)
// is ProtectedRoute's job, added in Frontend Milestone 2 once AuthContext exists.
export function AuthenticatedLayout() {
  return (
    <div>
      <nav>{/* nav placeholder -- built out alongside the design system in Milestone 2 */}</nav>
      <Outlet />
    </div>
  );
}
