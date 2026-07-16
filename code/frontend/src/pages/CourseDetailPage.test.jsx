import { test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { courseService } from "../services/course.service.js";
import { lessonService } from "../services/lesson.service.js";
import { CourseDetailPage } from "./CourseDetailPage.jsx";

vi.mock("../services/course.service.js", () => ({
  courseService: { getById: vi.fn() },
}));
vi.mock("../services/lesson.service.js", () => ({
  lessonService: { listForChapter: vi.fn() },
}));

const COURSE = {
  id: 9,
  title: "Quantum Machine Learning",
  narrative: "QML is a genuinely different computational paradigm.",
  chapters: [
    { id: 100, title: "Why Quantum, Why Now" },
    { id: 101, title: "The Quantum Bit, Visually" },
  ],
};

const LESSONS_BY_CHAPTER = {
  100: [
    { id: 1000, title: "Classical vs Quantum" },
    { id: 1001, title: "Why This Matters" },
  ],
  101: [{ id: 1002, title: "Seeing the Qubit" }],
};

function mockLessonsForChapters() {
  lessonService.listForChapter.mockImplementation((chapterId) =>
    Promise.resolve({ lessons: LESSONS_BY_CHAPTER[chapterId] ?? [], pagination: {} })
  );
}

function renderDetail(courseId = "9") {
  return render(
    <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
      <Routes>
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/courses" element={<div>Course catalog</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("fetches the course, then fetches every chapter's lessons in parallel", async () => {
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();

  expect(await screen.findByRole("heading", { name: "Quantum Machine Learning" })).toBeInTheDocument();
  expect(courseService.getById).toHaveBeenCalledWith("9");
  expect(lessonService.listForChapter).toHaveBeenCalledWith(100);
  expect(lessonService.listForChapter).toHaveBeenCalledWith(101);
  expect(lessonService.listForChapter).toHaveBeenCalledTimes(2);
  expect(screen.getByText("QML is a genuinely different computational paradigm.")).toBeInTheDocument();
});

test("the first chapter is expanded by default; later chapters start collapsed", async () => {
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  expect(screen.getByRole("button", { name: /Why Quantum, Why Now/ })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(screen.getByRole("button", { name: /The Quantum Bit, Visually/ })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(screen.getByRole("link", { name: "Classical vs Quantum" })).toHaveAttribute(
    "href",
    "/lessons/1000"
  );
  expect(screen.queryByRole("link", { name: "Seeing the Qubit" })).not.toBeInTheDocument();
});

test("shows each chapter's lesson count even while collapsed", async () => {
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  expect(screen.getByText("2 lessons")).toBeInTheDocument(); // chapter 100, expanded
  expect(screen.getByText("1 lesson")).toBeInTheDocument(); // chapter 101, collapsed -- singular
});

test("clicking a collapsed chapter expands it without collapsing the other one", async () => {
  const user = userEvent.setup();
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  await user.click(screen.getByRole("button", { name: /The Quantum Bit, Visually/ }));

  expect(screen.getByRole("button", { name: /The Quantum Bit, Visually/ })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(screen.getByRole("link", { name: "Seeing the Qubit" })).toHaveAttribute(
    "href",
    "/lessons/1002"
  );
  // The first chapter is untouched -- multi-expand, not single-open accordion.
  expect(screen.getByRole("button", { name: /Why Quantum, Why Now/ })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(screen.getByRole("link", { name: "Classical vs Quantum" })).toBeInTheDocument();
});

test("clicking an expanded chapter collapses it again", async () => {
  const user = userEvent.setup();
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  await user.click(screen.getByRole("button", { name: /Why Quantum, Why Now/ }));

  expect(screen.getByRole("button", { name: /Why Quantum, Why Now/ })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(screen.queryByRole("link", { name: "Classical vs Quantum" })).not.toBeInTheDocument();
});

test("chapters are numbered in order, zero-padded to two digits", async () => {
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  expect(screen.getByText("01")).toBeInTheDocument();
  expect(screen.getByText("02")).toBeInTheDocument();
});

test("chapter titles are real headings, so screen readers can jump between them", async () => {
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  expect(
    screen.getByRole("heading", { name: /Why Quantum, Why Now/ })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /The Quantum Bit, Visually/ })
  ).toBeInTheDocument();
});

// Critique fix: with no aria-label, JSX's own whitespace-stripping between the index/title/count
// spans left the accessible name as one run-on string with no word boundaries
// ("...Physically3 lessons") -- a screen reader announced number/letter seams instead of a
// scannable name.
test("each chapter header's accessible name is a scannable 'Chapter N: Title, X lessons', not run-on concatenated text", async () => {
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  expect(
    screen.getByRole("button", { name: "Chapter 1: Why Quantum, Why Now, 2 lessons" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Chapter 2: The Quantum Bit, Visually, 1 lesson" })
  ).toBeInTheDocument();
});

test("'Expand all' opens every chapter at once, then becomes 'Collapse all'", async () => {
  const user = userEvent.setup();
  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  renderDetail();
  await screen.findByRole("heading", { name: "Quantum Machine Learning" });

  await user.click(screen.getByRole("button", { name: "Expand all" }));

  expect(screen.getByRole("button", { name: /Why Quantum, Why Now/ })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(screen.getByRole("button", { name: /The Quantum Bit, Visually/ })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(screen.getByRole("link", { name: "Seeing the Qubit" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Collapse all" }));

  expect(screen.getByRole("button", { name: /Why Quantum, Why Now/ })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(screen.getByRole("button", { name: /The Quantum Bit, Visually/ })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(screen.queryByRole("button", { name: "Expand all" })).toBeInTheDocument();
});

test("a course with zero chapters shows a distinct empty state, not an empty chapter list", async () => {
  courseService.getById.mockResolvedValue({ ...COURSE, chapters: [] });
  renderDetail();

  expect(
    await screen.findByText("This course doesn’t have any chapters yet — check back soon.")
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Expand all" })).not.toBeInTheDocument();
});

test("a nonexistent course shows a 'not found' message with a link back to the catalog, no retry button", async () => {
  courseService.getById.mockRejectedValue({
    response: { data: { error: { code: "NOT_FOUND", message: "Course not found." } } },
  });
  renderDetail("999999");

  expect(await screen.findByText("Course not found.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to courses" })).toHaveAttribute("href", "/courses");
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
});

test("a generic fetch failure shows the error banner with a retry action that re-fetches", async () => {
  const user = userEvent.setup();
  courseService.getById.mockRejectedValueOnce(new Error("network down"));
  renderDetail();

  const banner = await screen.findByRole("alert");
  expect(banner).toHaveTextContent("Could not reach the server. Check your connection.");

  courseService.getById.mockResolvedValue(COURSE);
  mockLessonsForChapters();
  await user.click(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByRole("heading", { name: "Quantum Machine Learning" })).toBeInTheDocument();
});
