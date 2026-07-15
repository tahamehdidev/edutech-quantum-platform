import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { courseService } from "../services/course.service.js";
import { lessonService } from "../services/lesson.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Button } from "../components/ui/Button.jsx";
import "./CourseDetailPage.css";

const SKELETON_CHAPTER_COUNT = 6;

export function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessonsByChapterId, setLessonsByChapterId] = useState({});
  const [expandedChapterIds, setExpandedChapterIds] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCourse(null);

    async function load() {
      try {
        const courseResult = await courseService.getById(courseId);
        if (cancelled) return;

        // Eager, parallel -- GET /courses/:id only returns shallow chapters (no nested lessons),
        // but at today's real scale (6 chapters, 3-5 lessons each, verified against the actual
        // seeded data) fetching every chapter's lessons up front is cheap and keeps expand/collapse
        // pure UI state afterward, with no per-chapter loading/error tracking to build or test.
        const lessonResults = await Promise.all(
          courseResult.chapters.map((chapter) => lessonService.listForChapter(chapter.id))
        );
        if (cancelled) return;

        setCourse(courseResult);
        setLessonsByChapterId(
          Object.fromEntries(
            courseResult.chapters.map((chapter, index) => [
              chapter.id,
              lessonResults[index].lessons,
            ])
          )
        );
        setExpandedChapterIds(
          courseResult.chapters.length > 0 ? new Set([courseResult.chapters[0].id]) : new Set()
        );
      } catch (err) {
        if (!cancelled) setError(parseApiError(err));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, loadAttempt]);

  function toggleChapter(chapterId) {
    setExpandedChapterIds((current) => {
      const next = new Set(current);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }

  // Multi-expand independently toggling 6 chapters genuinely invites opening all of them at once
  // (critique-confirmed live: 25 lesson links in one continuous scroll, no way back to a scannable
  // view except closing each of the 6 one at a time) -- this is the documented escape hatch for
  // that exact state, not a generic utility added speculatively.
  const allExpanded =
    course !== null &&
    course.chapters.length > 0 &&
    expandedChapterIds.size === course.chapters.length;

  function toggleAllChapters() {
    setExpandedChapterIds(
      allExpanded ? new Set() : new Set(course.chapters.map((chapter) => chapter.id))
    );
  }

  if (error) {
    // A genuinely nonexistent course (bad/stale URL) can't be fixed by retrying -- point back to
    // the catalog instead of offering a retry button that would just fail the same way again.
    if (error.code === "NOT_FOUND") {
      return (
        <main className="course-detail">
          <p className="course-detail__not-found">{error.message}</p>
          <Link to="/courses" className="button button--primary">
            Back to courses
          </Link>
        </main>
      );
    }
    return (
      <main className="course-detail">
        <p className="course-detail__banner" role="alert">
          {error.message}
        </p>
        <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
      </main>
    );
  }

  return (
    <main className="course-detail">
      <Link to="/courses" className="course-detail__back">
        ← Back to courses
      </Link>
      {course === null ? (
        <CourseDetailSkeleton />
      ) : (
        <>
          <h1>{course.title}</h1>
          {course.narrative ? <p className="course-detail__narrative">{course.narrative}</p> : null}
          {course.chapters.length > 1 ? (
            <button
              type="button"
              className="course-detail__toggle-all"
              onClick={toggleAllChapters}
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          ) : null}
          <ul className="course-detail__chapters">
            {course.chapters.map((chapter, index) => (
              <ChapterAccordionItem
                key={chapter.id}
                chapter={chapter}
                index={index}
                lessons={lessonsByChapterId[chapter.id] ?? []}
                isExpanded={expandedChapterIds.has(chapter.id)}
                onToggle={() => toggleChapter(chapter.id)}
              />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function ChapterAccordionItem({ chapter, index, lessons, isExpanded, onToggle }) {
  const lessonListId = `chapter-${chapter.id}-lessons`;

  return (
    <li className="course-detail__chapter">
      {/* The heading wraps the trigger button (not the reverse) -- the WAI-ARIA disclosure/accordion
          pattern's recommended structure. A screen-reader user can now jump chapter-to-chapter by
          heading navigation; previously the title was a plain <span> and the page had exactly one
          heading (h1) with nothing below it. Visual weight is unchanged: the button's own
          font-weight/size rules already override whatever this h2 would otherwise cascade down. */}
      <h2 className="course-detail__chapter-heading">
        {/* Critique fix: with no aria-label, JSX's own whitespace-stripping between these three
            <span>s left the accessible name as one run-on string with no word boundaries
            ("...Physically3 lessons") -- a screen reader announced number/letter seams instead of
            a scannable name. Explicit aria-label gives back "Chapter N: Title, X lessons",
            matching the pattern already used for CourseCatalogPage's card links. */}
        <button
          type="button"
          className="course-detail__chapter-header"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={lessonListId}
          aria-label={`Chapter ${index + 1}: ${chapter.title}, ${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}`}
        >
          <ChevronRight
            size={18}
            aria-hidden="true"
            className="course-detail__chapter-chevron"
          />
          <span className="course-detail__chapter-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="course-detail__chapter-title">{chapter.title}</span>
          <span className="course-detail__chapter-count">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </span>
        </button>
      </h2>
      {isExpanded ? (
        <ul id={lessonListId} className="course-detail__lessons">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link to={`/lessons/${lesson.id}`} className="course-detail__lesson">
                {lesson.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CourseDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="course-detail__skeleton-line course-detail__skeleton-line--title" />
      <div className="course-detail__skeleton-line" />
      <div className="course-detail__skeleton-line course-detail__skeleton-line--short" />
      <ul className="course-detail__chapters">
        {Array.from({ length: SKELETON_CHAPTER_COUNT }, (_, index) => (
          <li key={index} className="course-detail__chapter course-detail__chapter--skeleton">
            <div className="course-detail__skeleton-line course-detail__skeleton-line--chapter" />
          </li>
        ))}
      </ul>
    </div>
  );
}
