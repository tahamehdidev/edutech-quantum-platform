import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RoleGate } from "./RoleGate.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

vi.mock("../../context/AuthContext.jsx", () => ({ useAuth: vi.fn() }));

function renderWithRole(role) {
  useAuth.mockReturnValue({ user: { role } });
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/" element={<div>Landing Page</div>} />
        <Route element={<RoleGate allowedRoles={["instructor", "admin"]} />}>
          <Route path="/dashboard" element={<div>Instructor Dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test("renders the gated route's content when the user's role is allowed", () => {
  renderWithRole("instructor");
  expect(screen.getByText("Instructor Dashboard")).toBeInTheDocument();
});

test("redirects to / when the user's role is not allowed", () => {
  renderWithRole("learner");
  expect(screen.getByText("Landing Page")).toBeInTheDocument();
});
