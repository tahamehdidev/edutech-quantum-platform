import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Waits for AuthContext's mount-time silent-refresh attempt (isLoading) to resolve before
// deciding to redirect -- otherwise a logged-in user gets bounced to /login on every page
// reload, for the brief window before that attempt completes.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
