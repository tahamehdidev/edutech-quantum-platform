import { test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import { authService } from "../services/auth.service.js";
import { LoginPage } from "./LoginPage.jsx";

vi.mock("../services/auth.service.js", () => ({
  authService: {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    refresh: vi.fn(),
  },
}));
vi.mock("../services/user.service.js", () => ({
  userService: { getMe: vi.fn() },
}));
vi.mock("../services/apiClient.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  configureAuth: vi.fn(),
}));

function renderLoginPage({ initialEntries = ["/login"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/courses" element={<div>Course catalog</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authService.refresh.mockRejectedValue(new Error("no session"));
});

test("submitting valid credentials logs in and redirects to /courses by default", async () => {
  const user = userEvent.setup();
  authService.login.mockResolvedValue({
    user: { id: "u1", name: "Ada", role: "learner" },
    accessToken: "token",
  });
  renderLoginPage();

  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "correct-password");
  await user.click(screen.getByRole("button", { name: "Log in" }));

  await waitFor(() => expect(screen.getByText("Course catalog")).toBeInTheDocument());
  expect(authService.login).toHaveBeenCalledWith({
    email: "ada@example.com",
    password: "correct-password",
  });
});

test("redirects back to the page ProtectedRoute bounced the visitor from", async () => {
  const user = userEvent.setup();
  authService.login.mockResolvedValue({
    user: { id: "u1", name: "Ada", role: "learner" },
    accessToken: "token",
  });

  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/login", state: { from: { pathname: "/dashboard" } } }]}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "correct-password");
  await user.click(screen.getByRole("button", { name: "Log in" }));

  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());
});

test("wrong password and a nonexistent email render the exact same message", async () => {
  const user = userEvent.setup();
  const invalidCredentialsError = {
    response: { data: { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } } },
  };
  authService.login.mockRejectedValue(invalidCredentialsError);
  renderLoginPage();

  await user.type(screen.getByLabelText("Email"), "nobody@example.com");
  await user.type(screen.getByLabelText("Password"), "whatever");
  await user.click(screen.getByRole("button", { name: "Log in" }));

  const banner = await screen.findByRole("alert");
  expect(banner).toHaveTextContent("Invalid email or password.");
  // Nothing in the rendered output should hint at which case it was.
  expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/wrong password/i)).not.toBeInTheDocument();
});

test("shows a success banner after being redirected here from a completed signup", () => {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/login", state: { justSignedUp: true } }]}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );

  expect(screen.getByText("Account created. Log in to continue.")).toBeInTheDocument();
});

test("disables the form and shows a loading submit button while the request is in flight", async () => {
  const user = userEvent.setup();
  let resolveLogin;
  authService.login.mockReturnValue(
    new Promise((resolve) => {
      resolveLogin = resolve;
    })
  );
  renderLoginPage();

  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "correct-password");
  await user.click(screen.getByRole("button", { name: "Log in" }));

  expect(screen.getByLabelText("Email")).toBeDisabled();
  expect(screen.getByLabelText("Password")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute("aria-busy", "true");

  resolveLogin({ user: { id: "u1", name: "Ada", role: "learner" }, accessToken: "token" });
  await waitFor(() => expect(screen.getByText("Course catalog")).toBeInTheDocument());
});
