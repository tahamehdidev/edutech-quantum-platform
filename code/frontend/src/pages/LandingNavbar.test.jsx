import { test, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { LandingNavbar } from "./LandingNavbar.jsx";

function renderNavbar() {
  return render(
    <BrowserRouter>
      <LandingNavbar />
    </BrowserRouter>
  );
}

test("renders the wordmark, section anchor links, and both CTAs", () => {
  renderNavbar();
  expect(screen.getByRole("link", { name: "Qubit — NUST" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "#courses");
  expect(screen.getByRole("link", { name: "Start anywhere" })).toHaveAttribute(
    "href",
    "#start-anywhere"
  );
  expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "#method");
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", "/signup");
});

test("the mobile menu is closed by default and opens/closes via the toggle button", async () => {
  const user = userEvent.setup();
  renderNavbar();

  expect(screen.queryByRole("region", { hidden: true })).not.toBeInTheDocument();
  const toggle = screen.getByRole("button", { name: "Open menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");

  await user.click(toggle);
  expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  const mobileMenu = document.getElementById("landing-navbar-mobile-menu");
  expect(within(mobileMenu).getByRole("link", { name: "Courses" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Close menu" }));
  expect(document.getElementById("landing-navbar-mobile-menu")).not.toBeInTheDocument();
});

test("clicking a link inside the open mobile menu closes it", async () => {
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Open menu" }));
  const mobileMenu = document.getElementById("landing-navbar-mobile-menu");
  await user.click(within(mobileMenu).getByRole("link", { name: "How it works" }));

  expect(document.getElementById("landing-navbar-mobile-menu")).not.toBeInTheDocument();
});

test("pressing Escape closes the open mobile menu", async () => {
  const user = userEvent.setup();
  renderNavbar();

  await user.click(screen.getByRole("button", { name: "Open menu" }));
  expect(document.getElementById("landing-navbar-mobile-menu")).toBeInTheDocument();

  await user.keyboard("{Escape}");
  expect(document.getElementById("landing-navbar-mobile-menu")).not.toBeInTheDocument();
});

test("locks background scroll while the mobile menu is open, and restores it on close", async () => {
  const user = userEvent.setup();
  renderNavbar();

  expect(document.body.style.overflow).toBe("");

  await user.click(screen.getByRole("button", { name: "Open menu" }));
  expect(document.body.style.overflow).toBe("hidden");

  await user.click(screen.getByRole("button", { name: "Close menu" }));
  expect(document.body.style.overflow).toBe("");
});
