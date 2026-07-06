import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Assumes ProtectedRoute already ran above this in the route tree (so `user` is populated) --
// RoleGate only adds a role check on top of that, it doesn't duplicate the authentication check
// itself. No dedicated "Forbidden" page exists yet, so it redirects to the landing page; this can
// change once one exists.
export function RoleGate({ allowedRoles }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
