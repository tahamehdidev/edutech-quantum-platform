import { test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { AuthenticatedLayout } from "./AuthenticatedLayout.jsx";

vi.mock("../../context/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));

function renderAt(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/courses" element={<div>Course catalog</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/" element={<div>Landing</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

test("renders no welcome toast when there's no welcomeName in router state", () => {
  useAuth.mockReturnValue({ logout: vi.fn() });
  renderAt("/courses");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("renders a welcome toast from location.state.welcomeName", () => {
  useAuth.mockReturnValue({ logout: vi.fn() });
  renderAt({ pathname: "/courses", state: { welcomeName: "Ada Lovelace" } });
  expect(screen.getByRole("status")).toHaveTextContent("Account created — welcome, Ada Lovelace.");
});

test("the welcome toast dismisses itself after a few seconds", async () => {
  useAuth.mockReturnValue({ logout: vi.fn() });
  vi.useFakeTimers();
  renderAt({ pathname: "/courses", state: { welcomeName: "Ada Lovelace" } });
  expect(screen.getByRole("status")).toBeInTheDocument();

  // waitFor's own polling relies on real timers, which deadlocks once fake timers are active --
  // advancing fake time asynchronously flushes the effect's setTimeout callback directly instead.
  await vi.advanceTimersByTimeAsync(4000);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

// Nav-flow audit: this whole nav used to be a literal empty placeholder comment -- no persistent
// way to reach /dashboard or log out existed anywhere in the app.
test("renders persistent Courses and Dashboard links", () => {
  useAuth.mockReturnValue({ logout: vi.fn() });
  renderAt("/courses");
  expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
});

// Critique fix: nav previously gave zero indication of current location -- color only changed
// on :hover and reverted the instant the mouse left, nothing for a screen reader.
test("marks the current route's nav link as active, both visually and via aria-current", () => {
  useAuth.mockReturnValue({ logout: vi.fn() });
  renderAt("/dashboard");

  const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
  const coursesLink = screen.getByRole("link", { name: "Courses" });
  expect(dashboardLink).toHaveAttribute("aria-current", "page");
  expect(dashboardLink.className).toContain("authenticated-layout__nav-link--active");
  expect(coursesLink).not.toHaveAttribute("aria-current");
  expect(coursesLink.className).not.toContain("authenticated-layout__nav-link--active");
});

test("Log out calls AuthContext's logout() and navigates to the landing page", async () => {
  const logout = vi.fn().mockResolvedValue();
  useAuth.mockReturnValue({ logout });
  const user = userEvent.setup();
  renderAt("/courses");

  await user.click(screen.getByRole("button", { name: "Log out" }));

  expect(logout).toHaveBeenCalled();
  expect(await screen.findByText("Landing")).toBeInTheDocument();
});
