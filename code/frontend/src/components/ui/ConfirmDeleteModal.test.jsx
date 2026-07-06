import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal.jsx";

test("the Delete button stays disabled until the typed name matches exactly", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(
    <ConfirmDeleteModal
      isOpen
      onClose={() => {}}
      onConfirm={onConfirm}
      resourceName="Quantum Algorithms"
      resourceLabel="course"
    />
  );

  const deleteButton = screen.getByRole("button", { name: "Delete" });
  expect(deleteButton).toBeDisabled();

  const input = screen.getByRole("textbox");
  await user.type(input, "Quantum Algorithm"); // one character short
  expect(deleteButton).toBeDisabled();

  await user.type(input, "s"); // now matches exactly
  expect(deleteButton).toBeEnabled();

  await user.click(deleteButton);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test("does not call onConfirm if the Delete button is clicked while still disabled", async () => {
  const onConfirm = vi.fn();
  render(
    <ConfirmDeleteModal
      isOpen
      onClose={() => {}}
      onConfirm={onConfirm}
      resourceName="Quantum Algorithms"
    />
  );
  screen.getByRole("button", { name: "Delete" }).click();
  expect(onConfirm).not.toHaveBeenCalled();
});

test("Cancel clears the typed text and calls onClose", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <ConfirmDeleteModal isOpen onClose={onClose} onConfirm={() => {}} resourceName="My Cohort" />
  );

  const input = screen.getByRole("textbox");
  await user.type(input, "something");
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(input).toHaveValue("");
});
