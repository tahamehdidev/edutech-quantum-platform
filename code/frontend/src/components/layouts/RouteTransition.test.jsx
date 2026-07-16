import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import { RouteTransition } from "./RouteTransition.jsx";

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/a"]}>
      <Routes>
        <Route element={<RouteTransition />}>
          <Route
            path="/a"
            element={
              <div>
                Page A<Link to="/b">Go to B</Link>
              </div>
            }
          />
          <Route path="/b" element={<div>Page B</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test("renders the matched route's content", () => {
  renderApp();
  expect(screen.getByText("Page A")).toBeInTheDocument();
});

test("a real navigation remounts the wrapper (fresh DOM node), which is what replays the CSS mount animation", async () => {
  const user = userEvent.setup();
  const { container } = renderApp();
  const firstNode = container.querySelector(".route-transition");

  await user.click(screen.getByRole("link", { name: "Go to B" }));

  expect(await screen.findByText("Page B")).toBeInTheDocument();
  const secondNode = container.querySelector(".route-transition");
  expect(secondNode).not.toBe(firstNode);
});

test("navigating to the same route does not remount the wrapper", async () => {
  const { container, rerender } = render(
    <MemoryRouter initialEntries={["/a"]}>
      <Routes>
        <Route element={<RouteTransition />}>
          <Route path="/a" element={<div>Page A, render 1</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
  const firstNode = container.querySelector(".route-transition");

  rerender(
    <MemoryRouter initialEntries={["/a"]}>
      <Routes>
        <Route element={<RouteTransition />}>
          <Route path="/a" element={<div>Page A, render 2</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("Page A, render 2")).toBeInTheDocument();
  expect(container.querySelector(".route-transition")).toBe(firstNode);
});
