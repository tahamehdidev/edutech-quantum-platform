import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar.jsx";

test("sets the correct ARIA progressbar attributes", () => {
  render(<ProgressBar value={30} max={100} label="XP progress" />);
  const bar = screen.getByRole("progressbar", { name: "XP progress" });
  expect(bar).toHaveAttribute("aria-valuenow", "30");
  expect(bar).toHaveAttribute("aria-valuemin", "0");
  expect(bar).toHaveAttribute("aria-valuemax", "100");
});

test("clamps a value above max down to max", () => {
  render(<ProgressBar value={150} max={100} label="Progress" />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
});

test("clamps a negative value up to 0", () => {
  render(<ProgressBar value={-10} max={100} label="Progress" />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});
