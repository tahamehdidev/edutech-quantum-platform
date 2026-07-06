import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Modal } from "./Modal.jsx";

// jsdom's <dialog> support doesn't fully simulate showModal()'s real focus-trap/::backdrop
// behavior, so these tests check the parts that matter for correctness -- content presence and
// the close callback -- rather than asserting on jsdom's approximation of native modal behavior.

test("renders its title and children", () => {
  render(
    <Modal isOpen onClose={() => {}} title="Delete course">
      <p>Are you sure?</p>
    </Modal>
  );
  expect(screen.getByText("Delete course")).toBeInTheDocument();
  expect(screen.getByText("Are you sure?")).toBeInTheDocument();
});

test("calls onClose when the close button is clicked", () => {
  const onClose = vi.fn();
  render(
    <Modal isOpen onClose={onClose} title="Delete course">
      <p>Are you sure?</p>
    </Modal>
  );
  screen.getByRole("button", { name: "Close" }).click();
  expect(onClose).toHaveBeenCalledTimes(1);
});
