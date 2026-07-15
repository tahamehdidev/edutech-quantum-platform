import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttemptActions } from "./AttemptActions.jsx";
import { ATTEMPT_STATUS } from "../../hooks/useQuestionAttempt.js";

test("renders a disabled Submit when isSubmitDisabled is true", () => {
  render(<AttemptActions status={ATTEMPT_STATUS.UNATTEMPTED} isSubmitDisabled />);
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test("renders a loading Submit while submitting", () => {
  render(<AttemptActions status={ATTEMPT_STATUS.SUBMITTING} />);
  const button = screen.getByRole("button");
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
});

test("renders Try Again and calls onRetry for terminal status incorrect", async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  render(<AttemptActions status={ATTEMPT_STATUS.INCORRECT} onRetry={onRetry} />);

  await user.click(screen.getByRole("button", { name: "Try Again" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

// Critique fix: identical "Try Again" wording/styling on a correct answer read as competing with
// the primary Next/Finish CTA at the flow's actual reward moment, implying something needed
// fixing when it didn't -- this is optional extra practice, not a correction.
test("renders 'Practice again' (not 'Try Again') and calls onRetry for terminal status correct", async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  render(<AttemptActions status={ATTEMPT_STATUS.CORRECT} onRetry={onRetry} />);

  expect(screen.queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Practice again" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test("renders See answer alongside Try Again for an incorrect, not-yet-revealed attempt", async () => {
  const user = userEvent.setup();
  const onReveal = vi.fn();
  render(<AttemptActions status={ATTEMPT_STATUS.INCORRECT} onReveal={onReveal} />);

  await user.click(screen.getByRole("button", { name: "See answer" }));
  expect(onReveal).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
});

test("hides See answer once isRevealed is true, keeping Try Again", () => {
  render(<AttemptActions status={ATTEMPT_STATUS.INCORRECT} isRevealed />);

  expect(screen.queryByRole("button", { name: "See answer" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
});

test("does not render See answer for a correct attempt", () => {
  render(<AttemptActions status={ATTEMPT_STATUS.CORRECT} />);

  expect(screen.queryByRole("button", { name: "See answer" })).not.toBeInTheDocument();
});

test("renders Retry Submission and calls onRetrySubmission for the error status", async () => {
  const user = userEvent.setup();
  const onRetrySubmission = vi.fn();
  render(<AttemptActions status={ATTEMPT_STATUS.ERROR} onRetrySubmission={onRetrySubmission} />);

  await user.click(screen.getByRole("button", { name: "Retry Submission" }));
  expect(onRetrySubmission).toHaveBeenCalledTimes(1);
});
