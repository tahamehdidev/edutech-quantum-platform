import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courseService } from "../services/course.service.js";
import { progressService } from "../services/progress.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { XpStreakBadge } from "../components/ui/XpStreakBadge.jsx";
import "./CourseCatalogPage.css";

// 3 skeleton placeholders regardless of the real course count -- there's no way to know how many
// are coming before the first response, and 3 happens to match today's real catalog size anyway.
const SKELETON_COUNT = 3;

// Conservative for the grid's own narrowest card width (280px, the grid's minmax floor) at
// --text-base/16px -- deliberately well under what 3 lines could hold even there, so the CSS
// line-clamp below (kept as a defensive safety net, not the primary truncation mechanism) is
// never actually forced to cut mid-word in practice. Confirmed live against all 3 real seeded
// narratives: the previous CSS-only clamp cut off mid-word ("...superconducting mi", "...trainable
// mode", "...specific proble") on every one of them, at both desktop and mobile widths.
const NARRATIVE_CHAR_BUDGET = 110;

export function truncateAtWordBoundary(text, maxLength) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

export function CourseCatalogPage() {
  const [courses, setCourses] = useState(null);
  const [progressByCourseId, setProgressByCourseId] = useState({});
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    async function load() {
      try {
        const [coursesResult, progressResult] = await Promise.all([
          courseService.list(),
          progressService.listForUser({ userId: "me" }),
        ]);
        if (cancelled) return;
        setCourses(coursesResult.courses);
        setProgressByCourseId(
          Object.fromEntries(progressResult.progress.map((entry) => [entry.course_id, entry]))
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
      <main className="course-catalog">
        <h1>Course Catalog</h1>
        <p className="course-catalog__banner" role="alert">
          {error}
        </p>
        <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
      </main>
    );
  }

  return (
    <main className="course-catalog">
      <h1>Course Catalog</h1>
      <div className="course-catalog__grid">
        {courses === null
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <CourseCardSkeleton key={index} />
            ))
          : courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progressByCourseId[course.id] ?? null}
              />
            ))}
      </div>
    </main>
  );
}

function CourseCard({ course, progress }) {
  // Progress.completed_at is a real, correct-to-check-for column, but no code anywhere in this
  // codebase ever sets it yet (course-completion detection is unspecified, out of scope for
  // every milestone built so far -- same honest framing as dashboard.service.js's
  // getCompletionStats()). This branch is correctly wired but currently unreachable: it will
  // start rendering the moment a future milestone adds that logic, not before.
  const isCompleted = Boolean(progress?.completed_at);
  // A returning learner scanning fast (critique's "Alex" persona) had to read all 3 status
  // slots to find the one to re-enter -- the badge alone didn't make the in-progress card pop
  // before reading it. A subtle accent border does, without touching the status-representation
  // redesign itself (deferred separately): full border-color change, not a side-stripe (banned).
  const isInProgress = Boolean(progress) && !isCompleted;

  return (
    <Link to={`/courses/${course.id}`} className="course-catalog__card-link">
      <Card
        className={
          "course-catalog__card" + (isInProgress ? " course-catalog__card--in-progress" : "")
        }
      >
        <h2>{course.title}</h2>
        {course.narrative ? (
          <p className="course-catalog__narrative">
            {truncateAtWordBoundary(course.narrative, NARRATIVE_CHAR_BUDGET)}
          </p>
        ) : null}
        <div className="course-catalog__status">
          {isCompleted ? (
            <span className="course-catalog__completed">Completed</span>
          ) : progress ? (
            <XpStreakBadge xp={progress.xp} streak={progress.current_streak} />
          ) : (
            <span className="course-catalog__not-started">Not started</span>
          )}
        </div>
      </Card>
    </Link>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="course-catalog__card course-catalog__card--skeleton" aria-hidden="true">
      <div className="course-catalog__skeleton-line course-catalog__skeleton-line--title" />
      <div className="course-catalog__skeleton-line" />
      <div className="course-catalog__skeleton-line" />
      <div className="course-catalog__skeleton-line course-catalog__skeleton-line--short" />
    </div>
  );
}
