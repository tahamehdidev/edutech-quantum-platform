import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button.jsx";

test("renders its label and calls onClick when clicked", () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Save</Button>);
  screen.getByRole("button", { name: "Save" }).click();
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("applies the requested variant class", () => {
  render(<Button variant="destructive">Delete</Button>);
  expect(screen.getByRole("button", { name: "Delete" }).className).toContain("button--destructive");
});

test("defaults to the primary variant", () => {
  render(<Button>Continue</Button>);
  expect(screen.getByRole("button", { name: "Continue" }).className).toContain("button--primary");
});

test("is disabled and shows aria-busy while isLoading", () => {
  render(<Button isLoading>Saving</Button>);
  const button = screen.getByRole("button");
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
});

test("is disabled when explicitly disabled, independent of isLoading", () => {
  render(<Button disabled>Continue</Button>);
  expect(screen.getByRole("button")).toBeDisabled();
});
