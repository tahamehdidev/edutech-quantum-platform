import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

vi.mock("../../context/AuthContext.jsx", () => ({ useAuth: vi.fn() }));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test("renders nothing while the silent-refresh-on-mount attempt is still in flight", () => {
  useAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
  const { container } = renderAt("/dashboard");
  expect(container).toBeEmptyDOMElement();
});

test("redirects to /login when not authenticated", () => {
  useAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
  renderAt("/dashboard");
  expect(screen.getByText("Login Page")).toBeInTheDocument();
});

test("renders the protected route's content when authenticated", () => {
  useAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
  renderAt("/dashboard");
  expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
});
