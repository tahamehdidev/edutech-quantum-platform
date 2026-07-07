import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttemptFeedback } from "./AttemptFeedback.jsx";
import { ATTEMPT_STATUS } from "../../hooks/useQuestionAttempt.js";

test("renders nothing for unattempted/submitting", () => {
  const { container: unattempted } = render(
    <AttemptFeedback status={ATTEMPT_STATUS.UNATTEMPTED} result={null} />
  );
  expect(unattempted).toBeEmptyDOMElement();

  const { container: submitting } = render(
    <AttemptFeedback status={ATTEMPT_STATUS.SUBMITTING} result={null} />
  );
  expect(submitting).toBeEmptyDOMElement();
});

test("renders the XP-awarded message for a first-time correct answer", () => {
  render(<AttemptFeedback status={ATTEMPT_STATUS.CORRECT} result={{ xpAwarded: true }} />);
  expect(screen.getByRole("status")).toHaveTextContent("Correct! XP awarded.");
});

test("renders the already-had-credit message when correct but xpAwarded is false", () => {
  render(<AttemptFeedback status={ATTEMPT_STATUS.CORRECT} result={{ xpAwarded: false }} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Correct! You already earned XP for this question."
  );
});

test("renders incorrect feedback", () => {
  render(<AttemptFeedback status={ATTEMPT_STATUS.INCORRECT} result={null} />);
  expect(screen.getByRole("status")).toHaveTextContent("Not quite — try again.");
});

test("renders a submission-error alert", () => {
  render(<AttemptFeedback status={ATTEMPT_STATUS.ERROR} result={null} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Could not submit your answer");
});
