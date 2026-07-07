import { test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Numeric } from "./Numeric.jsx";
import { numericQuestion, numericSubmitScenarios } from "./Numeric.fixtures.js";

test("renders the prompt and starts with Submit disabled (blank input)", () => {
  render(<Numeric question={numericQuestion} onSubmit={vi.fn()} />);

  expect(screen.getByText(numericQuestion.prompt)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test.each(["-", "1.2.3", "abc", "   "])(
  'keeps Submit disabled for the non-numeric input "%s"',
  async (badInput) => {
    const user = userEvent.setup();
    render(<Numeric question={numericQuestion} onSubmit={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), badInput);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  }
);

test("shows a visible format hint (not just aria-invalid) for non-numeric input, cleared once valid", async () => {
  const user = userEvent.setup();
  render(<Numeric question={numericQuestion} onSubmit={vi.fn()} />);
  const input = screen.getByRole("textbox");

  await user.type(input, "1.2.3");
  expect(screen.getByText("Enter a number to continue.")).toBeInTheDocument();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Enter a number to continue.");

  await user.clear(input);
  await user.type(input, "0.64");
  expect(screen.queryByText("Enter a number to continue.")).not.toBeInTheDocument();
  expect(input).toHaveAttribute("aria-invalid", "false");
});

test.each(["0.64", "-3", "1e2"])(
  'enables Submit and submits { value } as a number for "%s"',
  async (goodInput) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(numericSubmitScenarios.correctFirstAttempt);
    render(<Numeric question={numericQuestion} onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), goodInput);
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ value: Number(goodInput) });
  }
);

test("shows XP-awarded feedback and locks the input on a first-time correct answer", async () => {
  const user = userEvent.setup();
  render(
    <Numeric question={numericQuestion} onSubmit={numericSubmitScenarios.correctFirstAttempt} />
  );

  await user.type(screen.getByRole("textbox"), "0.64");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(screen.getByText(/^Correct!/)).toBeInTheDocument());
  expect(screen.getByText(/XP awarded/)).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBeDisabled();
});

test("shows the already-had-credit message when correct but xpAwarded is false", async () => {
  const user = userEvent.setup();
  render(
    <Numeric question={numericQuestion} onSubmit={numericSubmitScenarios.correctAlreadyEarnedXp} />
  );

  await user.type(screen.getByRole("textbox"), "0.64");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() =>
    expect(screen.getByText(/already earned XP for this question/)).toBeInTheDocument()
  );
});

test("shows incorrect feedback and a Try Again button that clears the input", async () => {
  const user = userEvent.setup();
  render(<Numeric question={numericQuestion} onSubmit={numericSubmitScenarios.incorrect} />);

  await user.type(screen.getByRole("textbox"), "0.5");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(screen.getByText("Not quite — try again.")).toBeInTheDocument());

  await user.click(screen.getByRole("button", { name: "Try Again" }));

  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test("shows a submission-error message with a retry that preserves the input", async () => {
  const user = userEvent.setup();
  render(<Numeric question={numericQuestion} onSubmit={numericSubmitScenarios.networkError} />);

  await user.type(screen.getByRole("textbox"), "0.64");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Could not submit your answer")
  );

  await user.click(screen.getByRole("button", { name: "Retry Submission" }));

  expect(screen.getByRole("textbox")).toHaveValue("0.64");
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
});
