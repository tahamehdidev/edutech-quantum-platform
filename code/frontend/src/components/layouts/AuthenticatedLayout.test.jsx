import { test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthenticatedLayout } from "./AuthenticatedLayout.jsx";

function renderAt(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/courses" element={<div>Course catalog</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

test("renders no welcome toast when there's no welcomeName in router state", () => {
  renderAt("/courses");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("renders a welcome toast from location.state.welcomeName", () => {
  renderAt({ pathname: "/courses", state: { welcomeName: "Ada Lovelace" } });
  expect(screen.getByRole("status")).toHaveTextContent("Account created — welcome, Ada Lovelace.");
});

test("the welcome toast dismisses itself after a few seconds", async () => {
  vi.useFakeTimers();
  renderAt({ pathname: "/courses", state: { welcomeName: "Ada Lovelace" } });
  expect(screen.getByRole("status")).toBeInTheDocument();

  // waitFor's own polling relies on real timers, which deadlocks once fake timers are active --
  // advancing fake time asynchronously flushes the effect's setTimeout callback directly instead.
  await vi.advanceTimersByTimeAsync(4000);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
