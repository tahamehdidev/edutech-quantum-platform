import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { XpStreakBadge } from "./XpStreakBadge.jsx";

test("renders the XP item when xp is a number", () => {
  render(<XpStreakBadge xp={120} />);
  expect(screen.getByText("120 XP")).toBeInTheDocument();
});

test("renders the streak item when streak is greater than 0", () => {
  render(<XpStreakBadge streak={5} />);
  expect(screen.getByText("5-day streak")).toBeInTheDocument();
});

test("renders both items together", () => {
  render(<XpStreakBadge xp={40} streak={3} />);
  expect(screen.getByText("40 XP")).toBeInTheDocument();
  expect(screen.getByText("3-day streak")).toBeInTheDocument();
});

test("does not render the streak item when streak is 0", () => {
  render(<XpStreakBadge xp={10} streak={0} />);
  expect(screen.queryByText(/streak/)).not.toBeInTheDocument();
});

test("renders nothing when neither xp nor streak is provided", () => {
  const { container } = render(<XpStreakBadge />);
  expect(container).toBeEmptyDOMElement();
});
