import { test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Mcq } from "./Mcq.jsx";
import { mcqQuestion, mcqSubmitScenarios } from "./Mcq.fixtures.js";

test("renders the prompt and every option, with Submit disabled until one is picked", () => {
  render(<Mcq question={mcqQuestion} onSubmit={vi.fn()} />);

  expect(screen.getByText(mcqQuestion.prompt)).toBeInTheDocument();
  mcqQuestion.content.options.forEach((option) => {
    expect(screen.getByLabelText(option)).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test("selecting an option enables Submit and submits { selectedOptionIndex }", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn(mcqSubmitScenarios.correctFirstAttempt);
  render(<Mcq question={mcqQuestion} onSubmit={onSubmit} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[1]));
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

  await user.click(screen.getByRole("button", { name: "Submit" }));
  expect(onSubmit).toHaveBeenCalledWith({ selectedOptionIndex: 1 });
});

test("shows a hint toggle when the question has one, and the explanation after a correct answer", async () => {
  const user = userEvent.setup();
  const questionWithHelp = {
    ...mcqQuestion,
    hint: "Compare the amplitudes before and after.",
  };
  const onSubmit = vi.fn(() =>
    Promise.resolve({
      isCorrect: true,
      xpAwarded: true,
      explanation: "Because the Hadamard gate creates an equal superposition.",
    })
  );
  render(<Mcq question={questionWithHelp} onSubmit={onSubmit} />);

  await user.click(screen.getByRole("button", { name: "Show hint" }));
  expect(screen.getByText("Compare the amplitudes before and after.")).toBeInTheDocument();

  await user.click(screen.getByLabelText(mcqQuestion.content.options[1]));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(
      screen.getByText("Because the Hadamard gate creates an equal superposition.")
    ).toBeInTheDocument()
  );
});

test("shows XP-awarded feedback and locks the options on a first-time correct answer", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.correctFirstAttempt} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[0]));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(screen.getByText(/^Correct!/)).toBeInTheDocument());
  expect(screen.getByText(/XP awarded/)).toBeInTheDocument();
  expect(screen.getByLabelText(mcqQuestion.content.options[0])).toBeDisabled();
});

test("shows the already-had-credit message when correct but xpAwarded is false", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.correctAlreadyEarnedXp} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[0]));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() =>
    expect(screen.getByText(/already earned XP for this question/)).toBeInTheDocument()
  );
});

test("shows incorrect feedback and a Try Again button that clears the selection", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.incorrect} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[2]));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(screen.getByText("Not quite — try again.")).toBeInTheDocument());
  // Regression guard for the caution-color migration -- the wrong option must carry the
  // incorrect class (--color-caution), not silently drift back to a destructive/error color.
  expect(screen.getByLabelText(mcqQuestion.content.options[2]).closest("label")).toHaveClass(
    "mcq__option--incorrect"
  );

  await user.click(screen.getByRole("button", { name: "Try Again" }));

  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  expect(screen.getByLabelText(mcqQuestion.content.options[2])).not.toBeChecked();
});

test("Try Again eliminates the just-submitted wrong option, disabling it for future selection", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.incorrect} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[2]));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(screen.getByText("Not quite — try again.")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Try Again" }));

  expect(screen.getByLabelText(mcqQuestion.content.options[2])).toBeDisabled();
  // A different, non-eliminated option is still freely selectable.
  expect(screen.getByLabelText(mcqQuestion.content.options[0])).toBeEnabled();
});

test("elimination accumulates across multiple wrong retries on the same question", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.incorrect} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[2]));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(screen.getByText("Not quite — try again.")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Try Again" }));

  await user.click(screen.getByLabelText(mcqQuestion.content.options[3]));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(screen.getByText("Not quite — try again.")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Try Again" }));

  expect(screen.getByLabelText(mcqQuestion.content.options[2])).toBeDisabled();
  expect(screen.getByLabelText(mcqQuestion.content.options[3])).toBeDisabled();
  expect(screen.getByLabelText(mcqQuestion.content.options[0])).toBeEnabled();
});

test("See answer reveals the correct option only after being clicked, and resets on retry", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.incorrect} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[2]));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(screen.getByText("Not quite — try again.")).toBeInTheDocument());

  // Not auto-revealed: the correct option (index 1) carries no correct styling yet.
  expect(screen.getByLabelText(mcqQuestion.content.options[1]).closest("label")).not.toHaveClass(
    "mcq__option--correct"
  );

  await user.click(screen.getByRole("button", { name: "See answer" }));
  expect(screen.getByLabelText(mcqQuestion.content.options[1]).closest("label")).toHaveClass(
    "mcq__option--correct"
  );
  expect(screen.queryByRole("button", { name: "See answer" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Try Again" }));
  expect(screen.getByLabelText(mcqQuestion.content.options[1]).closest("label")).not.toHaveClass(
    "mcq__option--correct"
  );
});

test("shows a submission-error message with a retry that preserves the selection", async () => {
  const user = userEvent.setup();
  render(<Mcq question={mcqQuestion} onSubmit={mcqSubmitScenarios.networkError} />);

  await user.click(screen.getByLabelText(mcqQuestion.content.options[3]));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Could not submit your answer")
  );

  await user.click(screen.getByRole("button", { name: "Retry Submission" }));

  expect(screen.getByLabelText(mcqQuestion.content.options[3])).toBeChecked();
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
});
