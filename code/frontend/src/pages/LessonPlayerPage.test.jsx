import { test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { lessonService } from "../services/lesson.service.js";
import { screenService } from "../services/screen.service.js";
import { practiceSetService } from "../services/practiceSet.service.js";
import { attemptService } from "../services/attempt.service.js";
import { LessonPlayerPage } from "./LessonPlayerPage.jsx";

vi.mock("../services/lesson.service.js", () => ({
  lessonService: { getById: vi.fn() },
}));
vi.mock("../services/screen.service.js", () => ({
  screenService: { listForLesson: vi.fn() },
}));
vi.mock("../services/practiceSet.service.js", () => ({
  practiceSetService: { listForLesson: vi.fn() },
}));
vi.mock("../services/attempt.service.js", () => ({
  attemptService: { submit: vi.fn() },
}));

const LESSON = { id: 7, chapter_id: 2, title: "Qubits 101", order_index: 1 };

const MCQ_QUESTION = {
  id: 55,
  type: "mcq",
  prompt: "Which state is |0⟩?",
  content: { options: ["Ground state", "Excited state"] },
};

const SCREENS = [
  { id: 900, lesson_id: 7, type: "explanation", content: { text: "A qubit has two states." }, order_index: 1, questions: [] },
  { id: 901, lesson_id: 7, type: "question", content: {}, order_index: 2, questions: [MCQ_QUESTION] },
  { id: 902, lesson_id: 7, type: "explanation", content: { text: "That's the basics." }, order_index: 3, questions: [] },
];

function renderPlayer(lessonId = "7") {
  return render(
    <MemoryRouter initialEntries={[`/lessons/${lessonId}`]}>
      <Routes>
        <Route path="/lessons/:lessonId" element={<LessonPlayerPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  lessonService.getById.mockResolvedValue(LESSON);
  screenService.listForLesson.mockResolvedValue({ screens: SCREENS, pagination: {} });
  practiceSetService.listForLesson.mockResolvedValue({ practiceSets: [], pagination: {} });
});

test("fetches the lesson and its screens in parallel, then shows the first screen", async () => {
  renderPlayer();

  expect(await screen.findByRole("heading", { name: "Qubits 101" })).toBeInTheDocument();
  expect(lessonService.getById).toHaveBeenCalledWith("7");
  expect(screenService.listForLesson).toHaveBeenCalledWith("7");
  expect(practiceSetService.listForLesson).toHaveBeenCalledWith("7");
  expect(screen.getByText("A qubit has two states.")).toBeInTheDocument();
  expect(screen.getByText("Screen 1 of 3")).toBeInTheDocument();
});

test("an explanation screen has Next enabled immediately and advances on click", async () => {
  const user = userEvent.setup();
  renderPlayer();
  await screen.findByText("A qubit has two states.");

  const nextButton = screen.getByRole("button", { name: /Next/ });
  expect(nextButton).toBeEnabled();
  await user.click(nextButton);

  expect(screen.getByText("Screen 2 of 3")).toBeInTheDocument();
  expect(screen.getByText("Which state is |0⟩?")).toBeInTheDocument();
});

test("a question screen disables Next until the attempt reaches a terminal state", async () => {
  const user = userEvent.setup();
  attemptService.submit.mockResolvedValue({ isCorrect: true, xpAwarded: true });
  renderPlayer();
  await screen.findByText("A qubit has two states.");
  await user.click(screen.getByRole("button", { name: /Next/ }));

  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

  await user.click(screen.getByLabelText("Ground state"));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  expect(await screen.findByText(/Correct!/)).toBeInTheDocument();
  expect(attemptService.submit).toHaveBeenCalledWith({
    questionId: 55,
    contextType: "screen",
    contextId: 901,
    answer: { selectedOptionIndex: 0 },
  });
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
});

test("an incorrect answer does not unlock Next; retrying and getting it correct does", async () => {
  const user = userEvent.setup();
  attemptService.submit.mockResolvedValueOnce({ isCorrect: false, xpAwarded: false });
  renderPlayer();
  await screen.findByText("A qubit has two states.");
  await user.click(screen.getByRole("button", { name: /Next/ }));

  await user.click(screen.getByLabelText("Ground state"));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  expect(await screen.findByText(/Not quite/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

  attemptService.submit.mockResolvedValueOnce({ isCorrect: true, xpAwarded: true });
  await user.click(screen.getByRole("button", { name: "Try Again" }));
  await user.click(screen.getByLabelText("Ground state"));
  await user.click(screen.getByRole("button", { name: "Submit" }));

  expect(await screen.findByText(/Correct!/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
});

test("going Back to an already-answered question screen preserves its graded state (no remount)", async () => {
  const user = userEvent.setup();
  attemptService.submit.mockResolvedValue({ isCorrect: true, xpAwarded: true });
  renderPlayer();
  await screen.findByText("A qubit has two states.");
  await user.click(screen.getByRole("button", { name: /Next/ }));
  await user.click(screen.getByLabelText("Ground state"));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await screen.findByText(/Correct!/);

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("That's the basics.")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));

  expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  expect(attemptService.submit).toHaveBeenCalledTimes(1);
});

test("Finish lesson on the last screen shows the completion state, and Back returns to the last screen", async () => {
  const user = userEvent.setup();
  attemptService.submit.mockResolvedValue({ isCorrect: true, xpAwarded: true });
  renderPlayer();
  await screen.findByText("A qubit has two states.");
  await user.click(screen.getByRole("button", { name: /Next/ }));
  await user.click(screen.getByLabelText("Ground state"));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await screen.findByText(/Correct!/);
  await user.click(screen.getByRole("button", { name: "Next" }));

  await user.click(screen.getByRole("button", { name: "Finish lesson" }));

  expect(screen.getByText("Lesson complete!")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Practice this lesson" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByText("That's the basics.")).toBeInTheDocument();

  // Regression test: leaving and returning from "Lesson complete!" must not remount the real
  // screens -- it previously did, resetting every visited question's graded state.
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  expect(attemptService.submit).toHaveBeenCalledTimes(1);
});

test("a lesson with a practice set shows a 'Practice this lesson' link once complete", async () => {
  const user = userEvent.setup();
  attemptService.submit.mockResolvedValue({ isCorrect: true, xpAwarded: true });
  practiceSetService.listForLesson.mockResolvedValue({
    practiceSets: [{ id: 300, lesson_id: 7, title: "Practice: Qubits 101" }],
    pagination: {},
  });
  renderPlayer();
  await screen.findByText("A qubit has two states.");
  await user.click(screen.getByRole("button", { name: /Next/ }));
  await user.click(screen.getByLabelText("Ground state"));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await screen.findByText(/Correct!/);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Finish lesson" }));

  expect(screen.getByRole("link", { name: "Practice this lesson" })).toHaveAttribute(
    "href",
    "/practice-sets/300"
  );
});

test("a nonexistent lesson shows a 'not found' message with a way back, no retry button", async () => {
  lessonService.getById.mockRejectedValue({
    response: { data: { error: { code: "NOT_FOUND", message: "Lesson not found." } } },
  });
  renderPlayer("999999");

  expect(await screen.findByText("Lesson not found.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
});

test("a generic fetch failure shows the error banner with a retry action that re-fetches", async () => {
  const user = userEvent.setup();
  lessonService.getById.mockRejectedValueOnce(new Error("network down"));
  renderPlayer();

  const banner = await screen.findByRole("alert");
  expect(banner).toHaveTextContent("Could not reach the server. Check your connection.");

  lessonService.getById.mockResolvedValue(LESSON);
  await user.click(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByRole("heading", { name: "Qubits 101" })).toBeInTheDocument();
});
