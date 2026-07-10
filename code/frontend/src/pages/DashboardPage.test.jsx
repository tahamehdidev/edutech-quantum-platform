import { test, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { courseService } from "../services/course.service.js";
import { progressService } from "../services/progress.service.js";
import { cohortService } from "../services/cohort.service.js";
import { dashboardService } from "../services/dashboard.service.js";
import { DashboardPage } from "./DashboardPage.jsx";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../services/course.service.js", () => ({
  courseService: { list: vi.fn() },
}));
vi.mock("../services/progress.service.js", () => ({
  progressService: { listForUser: vi.fn() },
}));
vi.mock("../services/cohort.service.js", () => ({
  cohortService: { list: vi.fn() },
}));
vi.mock("../services/dashboard.service.js", () => ({
  dashboardService: { getCompletion: vi.fn(), getLessonPacing: vi.fn() },
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("a learner sees a cross-course progress summary, not the course catalog's browse grid", async () => {
  useAuth.mockReturnValue({ user: { id: "u1", role: "learner" } });
  courseService.list.mockResolvedValue({
    courses: [
      { id: 8, title: "Quantum Computing Hardware" },
      { id: 9, title: "Quantum Machine Learning" },
      { id: 10, title: "Quantum Algorithms" },
    ],
  });
  progressService.listForUser.mockResolvedValue({
    progress: [
      { course_id: 8, xp: 120, current_streak: 3, completed_at: null },
      { course_id: 10, xp: 40, current_streak: 0, completed_at: null },
    ],
  });
  renderDashboard();

  // 160 (the real sum) only ever appears once, and only as the total -- distinct from either
  // individual course's own XP, which is what actually proves this is a sum, not a stray echo.
  const totalXp = await screen.findByText("160 XP");
  expect(totalXp).toHaveClass("dashboard__headline-stat-value");
  expect(screen.getByText("across all your courses")).toBeInTheDocument();
  // The whole row is the link now (critique fix: a title-only link left the card's padding and
  // XP badge outside the real touch target), so its accessible name includes the badge text too.
  expect(screen.getByRole("link", { name: /Quantum Computing Hardware/ })).toHaveAttribute(
    "href",
    "/courses/8"
  );
  expect(within(screen.getByText("Quantum Computing Hardware").closest("li")).getByText("120 XP")).toBeInTheDocument();
  expect(within(screen.getByText("Quantum Algorithms").closest("li")).getByText("40 XP")).toBeInTheDocument();
  // Only courses with a real Progress row appear -- QML (id 9, no progress) is absent.
  expect(screen.queryByText("Quantum Machine Learning")).not.toBeInTheDocument();
  expect(progressService.listForUser).toHaveBeenCalledWith({ userId: "me" });
});

test("a course row's whole card is the clickable link, not just the title text", async () => {
  useAuth.mockReturnValue({ user: { id: "u1", role: "learner" } });
  courseService.list.mockResolvedValue({
    courses: [{ id: 8, title: "Quantum Computing Hardware" }],
  });
  progressService.listForUser.mockResolvedValue({
    progress: [{ course_id: 8, xp: 120, current_streak: 3, completed_at: null }],
  });
  renderDashboard();

  const link = await screen.findByRole("link", { name: /Quantum Computing Hardware/ });
  // The Card, not just the title span, must be inside the link -- otherwise only the title's
  // own line-box is the real touch target (the critique-confirmed bug).
  expect(link.querySelector(".card")).toBeInTheDocument();
  expect(link.querySelector(".xp-streak-badge")).toBeInTheDocument();
});

test("a learner with zero progress rows sees an empty state pointing at the catalog", async () => {
  useAuth.mockReturnValue({ user: { id: "u1", role: "learner" } });
  courseService.list.mockResolvedValue({ courses: [] });
  progressService.listForUser.mockResolvedValue({ progress: [] });
  renderDashboard();

  expect(await screen.findByText(/started any courses yet/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse the course catalog" })).toHaveAttribute(
    "href",
    "/courses"
  );
});

test("an instructor with zero cohorts sees an empty state explaining cohorts are admin-provisioned, not a bare 'not found'", async () => {
  useAuth.mockReturnValue({ user: { id: "i1", role: "instructor" } });
  cohortService.list.mockResolvedValue({ cohorts: [] });
  renderDashboard();

  expect(await screen.findByText(/have any cohorts yet/)).toBeInTheDocument();
  expect(screen.getByText(/provisioned directly by an admin/)).toBeInTheDocument();
  expect(dashboardService.getCompletion).not.toHaveBeenCalled();
});

test("an instructor with exactly one cohort skips the picker and loads its completion + pacing data directly", async () => {
  useAuth.mockReturnValue({ user: { id: "i1", role: "instructor" } });
  cohortService.list.mockResolvedValue({ cohorts: [{ id: 5, name: "Fall Cohort" }] });
  dashboardService.getCompletion.mockResolvedValue({
    courses: [
      {
        courseId: 2,
        courseTitle: "Quantum Algorithms",
        totalStudents: 24,
        completed: 0,
        inProgress: 13,
        notStarted: 11,
        averageXp: 340,
      },
    ],
  });
  dashboardService.getLessonPacing.mockResolvedValue({
    lessons: [
      {
        lessonId: 14,
        lessonTitle: "Superconducting Qubits",
        averageInterQuestionSeconds: 142,
        sampleSize: 18,
        note: "Approximate — measures time between consecutive question attempts only. Does not capture time on screens without questions, or time before the first question in a lesson.",
      },
    ],
  });
  renderDashboard();

  expect(await screen.findByText("Quantum Algorithms")).toBeInTheDocument();
  expect(screen.queryByLabelText("Cohort")).not.toBeInTheDocument();
  expect(dashboardService.getCompletion).toHaveBeenCalledWith(5);
  expect(dashboardService.getLessonPacing).toHaveBeenCalledWith(5);
  // Headline stat mirrors the learner view's "100 XP" card -- an orienting number before the
  // per-course breakdown, instead of diving straight into card 1 of N (critique finding).
  const headlineValue = screen.getByText("24");
  expect(headlineValue).toHaveClass("dashboard__headline-stat-value");
  expect(screen.getByText("students enrolled, across 1 course")).toBeInTheDocument();
  expect(screen.getByText("13 in progress · 11 not started · 0 completed · 340 avg XP")).toBeInTheDocument();
  // A full bar here means "everyone started," not "everyone finished" -- this visible caption
  // (not just the ProgressBar's aria-label) is what tells a sighted user that.
  expect(screen.getByText("Engagement (started or completed)")).toBeInTheDocument();

  // The note field renders verbatim -- never dropped or paraphrased.
  expect(
    screen.getByText(
      "Approximate — measures time between consecutive question attempts only. Does not capture time on screens without questions, or time before the first question in a lesson."
    )
  ).toBeInTheDocument();
});

test("the headline stat singularizes correctly for exactly one student and one course", async () => {
  useAuth.mockReturnValue({ user: { id: "i1", role: "instructor" } });
  cohortService.list.mockResolvedValue({ cohorts: [{ id: 5, name: "Fall Cohort" }] });
  dashboardService.getCompletion.mockResolvedValue({
    courses: [
      {
        courseId: 9,
        courseTitle: "Quantum Machine Learning",
        totalStudents: 1,
        completed: 0,
        inProgress: 1,
        notStarted: 0,
        averageXp: 20,
      },
    ],
  });
  dashboardService.getLessonPacing.mockResolvedValue({ lessons: [] });
  renderDashboard();

  expect(await screen.findByText("student enrolled, across 1 course")).toBeInTheDocument();
});

test("an instructor with multiple cohorts sees a picker, and switching cohorts re-fetches both endpoints", async () => {
  const user = userEvent.setup();
  useAuth.mockReturnValue({ user: { id: "i1", role: "instructor" } });
  cohortService.list.mockResolvedValue({
    cohorts: [
      { id: 5, name: "Fall Cohort" },
      { id: 6, name: "Spring Cohort" },
    ],
  });
  dashboardService.getCompletion.mockResolvedValue({ courses: [] });
  dashboardService.getLessonPacing.mockResolvedValue({ lessons: [] });
  renderDashboard();

  await screen.findByLabelText("Cohort");
  expect(dashboardService.getCompletion).toHaveBeenCalledWith(5);

  await user.selectOptions(screen.getByLabelText("Cohort"), "6");
  expect(dashboardService.getCompletion).toHaveBeenCalledWith(6);
  expect(dashboardService.getLessonPacing).toHaveBeenCalledWith(6);
});

test("an admin is treated the same as an instructor for this screen", async () => {
  useAuth.mockReturnValue({ user: { id: "a1", role: "admin" } });
  cohortService.list.mockResolvedValue({ cohorts: [] });
  renderDashboard();

  expect(await screen.findByText(/have any cohorts yet/)).toBeInTheDocument();
});
