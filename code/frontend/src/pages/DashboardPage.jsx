import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { courseService } from "../services/course.service.js";
import { progressService } from "../services/progress.service.js";
import { cohortService } from "../services/cohort.service.js";
import { dashboardService } from "../services/dashboard.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ProgressBar } from "../components/ui/ProgressBar.jsx";
import { XpStreakBadge } from "../components/ui/XpStreakBadge.jsx";
import "./DashboardPage.css";

// Role-branches once, at the top, into two components that share nothing beyond page chrome --
// there's no step-through/gating logic here at all (this is a read-only reporting screen, not a
// lesson/practice-set interaction), so neither branch needs anything from those two pages.
export function DashboardPage() {
  const { user } = useAuth();
  return user.role === "learner" ? <LearnerDashboard /> : <InstructorDashboard />;
}

// Both role branches hit an identical top-level error banner and initial skeleton -- shared here
// since both copies exist in this same file (not a cross-screen "maybe a third one shows up"
// case like Lesson Player/Practice Set's step-through logic), so there's no speculative-reuse
// risk in extracting immediately.
function DashboardError({ message, onRetry }) {
  return (
    <main className="dashboard">
      <h1>Dashboard</h1>
      <p className="dashboard__banner" role="alert">
        {message}
      </p>
      <Button onClick={onRetry}>Try again</Button>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="dashboard">
      <div aria-hidden="true" className="dashboard__skeleton">
        <div className="dashboard__skeleton-line dashboard__skeleton-line--title" />
        <div className="dashboard__skeleton-line" />
        <div className="dashboard__skeleton-line" />
      </div>
    </main>
  );
}

function LearnerDashboard() {
  // Courses the learner has actually engaged with only -- this is "my progress so far", not a
  // second copy of Course Catalog's browse-everything grid. A course with no Progress row simply
  // doesn't appear here.
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setEntries(null);

    async function load() {
      try {
        const [coursesResult, progressResult] = await Promise.all([
          courseService.list(),
          progressService.listForUser({ userId: "me" }),
        ]);
        if (cancelled) return;
        const titleByCourseId = Object.fromEntries(
          coursesResult.courses.map((course) => [course.id, course.title])
        );
        setEntries(
          progressResult.progress.map((row) => ({
            ...row,
            courseTitle: titleByCourseId[row.course_id] ?? "Untitled course",
          }))
        );
      } catch (err) {
        if (!cancelled) setError(parseApiError(err).message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  if (error) {
    return (
      <DashboardError message={error} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
    );
  }

  if (entries === null) {
    return <DashboardSkeleton />;
  }

  const totalXp = entries.reduce((sum, entry) => sum + entry.xp, 0);

  return (
    <main className="dashboard">
      <h1>Dashboard</h1>
      {entries.length === 0 ? (
        <p className="dashboard__empty">
          You haven&rsquo;t started any courses yet.{" "}
          <Link to="/courses">Browse the course catalog</Link> to get going.
        </p>
      ) : (
        <>
          <Card className="dashboard__headline-stat">
            <span className="dashboard__headline-stat-value">{totalXp} XP</span>
            <span className="dashboard__headline-stat-label">across all your courses</span>
          </Card>
          <ul className="dashboard__list">
            {entries.map((entry) => (
              <li key={entry.course_id}>
                <Link to={`/courses/${entry.course_id}`} className="dashboard__row-link">
                  <Card className="dashboard__row">
                    <span className="dashboard__row-title">{entry.courseTitle}</span>
                    {entry.completed_at ? (
                      <span className="dashboard__completed">Completed</span>
                    ) : (
                      <XpStreakBadge xp={entry.xp} streak={entry.current_streak} />
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function InstructorDashboard() {
  const [cohorts, setCohorts] = useState(null);
  const [selectedCohortId, setSelectedCohortId] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [pacing, setPacing] = useState(null);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCohorts(null);
    setSelectedCohortId(null);

    async function load() {
      try {
        const result = await cohortService.list();
        if (cancelled) return;
        setCohorts(result.cohorts);
        if (result.cohorts.length > 0) {
          setSelectedCohortId(result.cohorts[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(parseApiError(err).message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (selectedCohortId === null) return;
    let cancelled = false;
    setCompletion(null);
    setPacing(null);

    async function loadCohortData() {
      try {
        const [completionResult, pacingResult] = await Promise.all([
          dashboardService.getCompletion(selectedCohortId),
          dashboardService.getLessonPacing(selectedCohortId),
        ]);
        if (cancelled) return;
        setCompletion(completionResult.courses);
        setPacing(pacingResult.lessons);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err).message);
      }
    }
    loadCohortData();
    return () => {
      cancelled = true;
    };
  }, [selectedCohortId]);

  if (error) {
    return (
      <DashboardError message={error} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
    );
  }

  if (cohorts === null) {
    return <DashboardSkeleton />;
  }

  if (cohorts.length === 0) {
    return (
      <main className="dashboard">
        <h1>Dashboard</h1>
        <p className="dashboard__empty">
          You don&rsquo;t have any cohorts yet. Cohorts are provisioned directly by an admin
          &mdash; there&rsquo;s no self-serve cohort creation in this app yet, so this isn&rsquo;t
          a sign anything is broken.
        </p>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <h1>Dashboard</h1>
      {cohorts.length > 1 ? (
        <label className="dashboard__cohort-picker">
          Cohort
          <select
            value={selectedCohortId ?? ""}
            onChange={(event) => setSelectedCohortId(Number(event.target.value))}
          >
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {/* completion[0].totalStudents is safe to read from just the first row -- the backend
          computes it as the cohort's whole active-roster size (a single CROSS JOIN per query,
          per dashboard.service.js), so every row in this array carries the same value. */}
      {completion !== null && completion.length > 0 ? (
        <Card className="dashboard__headline-stat">
          <span className="dashboard__headline-stat-value">{completion[0].totalStudents}</span>
          <span className="dashboard__headline-stat-label">
            {completion[0].totalStudents === 1 ? "student enrolled" : "students enrolled"}, across{" "}
            {completion.length} {completion.length === 1 ? "course" : "courses"}
          </span>
        </Card>
      ) : null}

      <section className="dashboard__section">
        <h2>Completion</h2>
        {completion === null ? (
          <div aria-hidden="true" className="dashboard__skeleton">
            <div className="dashboard__skeleton-line" />
          </div>
        ) : completion.length === 0 ? (
          <p className="dashboard__empty">No students have started a course in this cohort yet.</p>
        ) : (
          <ul className="dashboard__list">
            {completion.map((course) => (
              <li key={course.courseId}>
                <Card className="dashboard__row">
                  <h3>{course.courseTitle}</h3>
                  {/* The bar reads "engagement" (started + completed), not "% complete" -- a
                      full bar can happen the moment every enrolled student has merely started,
                      which would otherwise misread as "done" in a section titled Completion.
                      The aria-label already said this for screen readers; this caption gives
                      sighted users scanning bars quickly the same signal (critique finding). */}
                  <p className="dashboard__bar-caption">Engagement (started or completed)</p>
                  <ProgressBar
                    value={course.completed + course.inProgress}
                    max={course.totalStudents}
                    label={`${course.courseTitle} engagement`}
                  />
                  <p className="dashboard__stats">
                    {course.inProgress} in progress · {course.notStarted} not started ·{" "}
                    {course.completed} completed · {course.averageXp} avg XP
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard__section">
        <h2>Lesson pacing</h2>
        {pacing === null ? (
          <div aria-hidden="true" className="dashboard__skeleton">
            <div className="dashboard__skeleton-line" />
          </div>
        ) : pacing.length === 0 ? (
          <p className="dashboard__empty">No question attempts recorded in this cohort yet.</p>
        ) : (
          <ul className="dashboard__list">
            {pacing.map((lesson) => (
              <li key={lesson.lessonId}>
                <Card className="dashboard__row">
                  <h3>{lesson.lessonTitle}</h3>
                  <p className="dashboard__stats">
                    {lesson.averageInterQuestionSeconds}s avg between questions (n=
                    {lesson.sampleSize})
                  </p>
                  <p className="dashboard__note">{lesson.note}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
