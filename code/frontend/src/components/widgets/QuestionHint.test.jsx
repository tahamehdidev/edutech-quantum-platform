import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionHint } from "./QuestionHint.jsx";

test("renders nothing when the question has no hint", () => {
  const { container } = render(<QuestionHint hint={null} />);
  expect(container).toBeEmptyDOMElement();
});

test("hint text is hidden until the toggle is clicked, then hidden again on a second click", async () => {
  const user = userEvent.setup();
  render(<QuestionHint hint="Think about what a measurement does to superposition." />);

  expect(
    screen.queryByText("Think about what a measurement does to superposition.")
  ).not.toBeInTheDocument();

  const toggle = screen.getByRole("button", { name: "Show hint" });
  await user.click(toggle);
  expect(
    screen.getByText("Think about what a measurement does to superposition.")
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Hide hint" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Hide hint" }));
  expect(
    screen.queryByText("Think about what a measurement does to superposition.")
  ).not.toBeInTheDocument();
});
