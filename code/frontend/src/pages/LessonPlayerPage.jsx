import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleCheckBig } from "lucide-react";
import { lessonService } from "../services/lesson.service.js";
import { screenService } from "../services/screen.service.js";
import { practiceSetService } from "../services/practiceSet.service.js";
import { attemptService } from "../services/attempt.service.js";
import { courseService } from "../services/course.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Button } from "../components/ui/Button.jsx";
import { QuestionRenderer } from "../components/ui/QuestionRenderer.jsx";
import { getCourseIcon } from "../components/ui/CourseIcons.jsx";
import "./LessonPlayerPage.css";

export function LessonPlayerPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [screens, setScreens] = useState(null);
  const [practiceSets, setPracticeSets] = useState([]);
  // Wayfinding only (course title, chapter position, sibling-lesson outline) -- fetched
  // independently of the lesson/screens/practiceSets above (same "primary task vs. secondary
  // enhancement" split as Course Catalog's own progress fetch), so a failure here never blocks
  // the actual lesson content from rendering. null until it resolves.
  const [chapterContext, setChapterContext] = useState(null);
  // currentIndex ranges 0..screens.length inclusive -- screens.length itself is the "lesson
  // complete" state, not a separate boolean. This means leaving/returning from it (Back/Next)
  // is the exact same code path as moving between any two real screens, with no special-casing.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);
  const [passedScreenIds, setPassedScreenIds] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLesson(null);
    setScreens(null);
    setPracticeSets([]);
    setChapterContext(null);
    setCurrentIndex(0);
    setMaxVisitedIndex(0);
    setPassedScreenIds(new Set());

    async function load() {
      try {
        const [lessonResult, screensResult, practiceSetsResult] = await Promise.all([
          lessonService.getById(lessonId),
          screenService.listForLesson(lessonId),
          practiceSetService.listForLesson(lessonId),
        ]);
        if (cancelled) return;
        setLesson(lessonResult);
        setScreens(screensResult.screens);
        setPracticeSets(practiceSetsResult.practiceSets);

        try {
          const [courseResult, chapterLessonsResult] = await Promise.all([
            courseService.getById(lessonResult.course_id),
            lessonService.listForChapter(lessonResult.chapter_id),
          ]);
          if (cancelled) return;
          const chapterIndex = courseResult.chapters.findIndex(
            (chapter) => chapter.id === lessonResult.chapter_id
          );
          setChapterContext({
            courseTitle: courseResult.title,
            chapterTitle: courseResult.chapters[chapterIndex]?.title ?? "",
            chapterNumber: chapterIndex + 1,
            totalChapters: courseResult.chapters.length,
            siblingLessons: chapterLessonsResult.lessons,
          });
        } catch {
          // Silently degrade -- purely a wayfinding enhancement (chapter position, sibling-lesson
          // outline); the lesson content set above already rendered and is fully usable without it.
        }
      } catch (err) {
        if (!cancelled) setError(parseApiError(err));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, loadAttempt]);

  const isComplete = currentIndex === screens?.length;
  const currentScreen = screens && !isComplete ? screens[currentIndex] : null;
  const hasQuestionToAnswer =
    currentScreen?.type === "question" && (currentScreen.questions?.length ?? 0) > 0;
  const isNextDisabled = hasQuestionToAnswer && !passedScreenIds.has(currentScreen.id);

  function markScreenPassed(screenId) {
    setPassedScreenIds((current) => new Set(current).add(screenId));
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setMaxVisitedIndex((current) => Math.max(current, nextIndex));
  }

  function handleBack() {
    setCurrentIndex((current) => Math.max(0, current - 1));
  }

  if (error) {
    if (error.code === "NOT_FOUND") {
      // No lesson data ever loaded here (the fetch itself 404'd), so there's no course_id to
      // link back to -- the catalog is the safest known-good destination. Was navigate(-1)
      // (nav-flow audit: fragile on a direct/shared/refreshed URL with no useful history).
      return (
        <main className="lesson-player">
          <p className="lesson-player__not-found">{error.message}</p>
          <Link to="/courses" className="button button--secondary">
            Back to courses
          </Link>
        </main>
      );
    }
    return (
      <main className="lesson-player">
        <p className="lesson-player__banner" role="alert">
          {error.message}
        </p>
        <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
      </main>
    );
  }

  if (lesson === null || screens === null) {
    return (
      <main className="lesson-player">
        <div aria-hidden="true" className="lesson-player__skeleton">
          <div className="lesson-player__skeleton-line lesson-player__skeleton-line--title" />
          <div className="lesson-player__skeleton-line lesson-player__skeleton-line--bar" />
          <div className="lesson-player__skeleton-line" />
          <div className="lesson-player__skeleton-line lesson-player__skeleton-line--short" />
        </div>
      </main>
    );
  }

  if (screens.length === 0) {
    return (
      <main className="lesson-player">
        <div className="lesson-player__main">
          <Link to={`/courses/${lesson.course_id}`} className="lesson-player__exit">
            <ChevronLeft size={16} aria-hidden="true" />
            Exit lesson
          </Link>
          <h1>{lesson.title}</h1>
          <p className="lesson-player__not-found">This lesson has no content yet.</p>
        </div>
      </main>
    );
  }

  const CourseIcon = chapterContext ? getCourseIcon(chapterContext.courseTitle) : null;
  const totalLessonsInChapter = chapterContext?.siblingLessons.length ?? null;

  return (
    <main className="lesson-player">
      <div className="lesson-player__layout">
        <div className="lesson-player__main">
          {/* Was navigate(-1) (nav-flow audit: history-based, fragile on a direct/shared/refreshed
              URL) -- a real link to the lesson's own course, always reachable regardless of how
              the visitor arrived here. */}
          <Link to={`/courses/${lesson.course_id}`} className="lesson-player__exit">
            <ChevronLeft size={16} aria-hidden="true" />
            Exit lesson
          </Link>

          {/* Reinvention pass: real orientation (course icon + chapter/lesson position), not just
              a bare title -- a learner deep in a long course previously had no reminder of where
              this lesson sits until chapterContext resolves (a secondary, silently-degrading
              fetch; see the load effect above), so this whole block is conditional on it. */}
          <div className="lesson-player__header">
            {CourseIcon ? (
              <div className="lesson-player__header-icon-chip">
                <CourseIcon className="lesson-player__header-icon" />
              </div>
            ) : null}
            <div className="lesson-player__header-text">
              <h1>{lesson.title}</h1>
              {chapterContext ? (
                <p className="lesson-player__context">
                  {chapterContext.courseTitle} · Chapter {chapterContext.chapterNumber} of{" "}
                  {chapterContext.totalChapters} · Lesson {lesson.order_index} of{" "}
                  {totalLessonsInChapter}
                </p>
              ) : null}
            </div>
          </div>

          {/* Screen-type dots (was a plain ProgressBar) -- a map of what's ahead, not just a
              percentage: every screen's state (visited-and-passed, current, or upcoming) is
              visible at a glance, plus one final dot for the lesson-complete step itself. */}
          <ol className="lesson-player__dots" aria-label="Lesson progress">
            {screens.map((screen, index) => (
              <li key={screen.id}>
                <span
                  className={[
                    "lesson-player__dot",
                    index < currentIndex && "lesson-player__dot--done",
                    index === currentIndex && !isComplete && "lesson-player__dot--current",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={index === currentIndex && !isComplete ? "step" : undefined}
                />
              </li>
            ))}
            <li>
              <span
                className={[
                  "lesson-player__dot",
                  "lesson-player__dot--complete",
                  isComplete && "lesson-player__dot--current",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isComplete ? "step" : undefined}
              />
            </li>
          </ol>
          {!isComplete ? (
            <p className="lesson-player__step-count" aria-live="polite">
              Screen {currentIndex + 1} of {screens.length}
            </p>
          ) : null}

          {/* Real screens are never conditionally unmounted, including once "complete" -- only
              hidden. Swapping this block out entirely on isComplete (as an earlier version did)
              reset every visited screen's internal attempt state on Back, since React remounts
              fresh components rather than reusing the ones that existed before the swap. */}
          {screens.slice(0, maxVisitedIndex + 1).map((screen, index) => (
            <div
              key={screen.id}
              hidden={isComplete || index !== currentIndex}
              className="lesson-player__screen"
            >
              <LessonScreenContent screen={screen} onPassed={markScreenPassed} />
            </div>
          ))}
          {isComplete ? (
            <div className="lesson-player__complete" role="status">
              {/* Delight pass (deferred from an earlier critique): PartyPopper read closer to
                  Duolingo-style gamified-microlearning than this brand's own "rigorous, calm,
                  precise, NOT Duolingo-cute" mandate -- a check-circle signals genuine completion
                  without the confetti connotation, and is a different visual weight than
                  AttemptFeedback's small inline Check (per-question), appropriate for this bigger,
                  once-per-lesson moment. */}
              <CircleCheckBig size={32} aria-hidden="true" />
              <p className="lesson-player__complete-heading">Lesson complete!</p>
              {/* Nav-flow audit: finishing a lesson previously had zero forward navigation at all
                  when no practice set existed for it -- "Back to course" is now always present,
                  and "Next lesson" appears whenever lesson.next_lesson_id says one exists (same
                  chapter, else the next chapter's first lesson). */}
              <div className="lesson-player__complete-actions">
                {practiceSets.length > 0 ? (
                  <Link
                    to={`/practice-sets/${practiceSets[0].id}`}
                    className="button button--primary"
                  >
                    Practice this lesson
                  </Link>
                ) : null}
                {lesson.next_lesson_id ? (
                  <Link to={`/lessons/${lesson.next_lesson_id}`} className="button button--primary">
                    Next lesson
                  </Link>
                ) : null}
                <Link to={`/courses/${lesson.course_id}`} className="button button--secondary">
                  Back to course
                </Link>
              </div>
            </div>
          ) : null}

          <div className="lesson-player__nav">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={currentIndex === 0}
            >
              Back
            </Button>
            {!isComplete ? (
              <Button type="button" onClick={handleNext} disabled={isNextDisabled}>
                {currentIndex === screens.length - 1 ? "Finish lesson" : "Next"}
                {currentIndex !== screens.length - 1 ? (
                  <ChevronRight size={16} aria-hidden="true" />
                ) : null}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Wide-viewport-only mini outline of this chapter's own lessons -- fills the space that
            used to just be centered whitespace either side of the 700px reading column, with
            something genuinely useful (jump to any sibling lesson) rather than decoration.
            Hidden below the layout's own breakpoint (see CSS) -- a phone has no spare width for
            this in the first place. */}
        {chapterContext && chapterContext.siblingLessons.length > 1 ? (
          <aside className="lesson-player__outline" aria-label="Chapter lessons">
            <h2 className="lesson-player__outline-heading">{chapterContext.chapterTitle}</h2>
            <ol className="lesson-player__outline-list">
              {chapterContext.siblingLessons.map((sibling) => {
                const isCurrent = sibling.id === lesson.id;
                return (
                  <li key={sibling.id}>
                    <Link
                      to={`/lessons/${sibling.id}`}
                      className={
                        "lesson-player__outline-link" +
                        (isCurrent ? " lesson-player__outline-link--current" : "")
                      }
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      <span className="lesson-player__outline-index">{sibling.order_index}</span>
                      {sibling.title}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

// Dual-agent critique finding (P1): identical bra-ket notation rendered in two different fonts
// depending on which screen it landed on -- the Bloch sphere's own readout already opts into
// font-mono (this app's own "equations/notation" type role), while explanation-screen prose
// rendered the same |0⟩/|ψ⟩ notation in the plain body font. Plain regex split (no
// dangerouslySetInnerHTML) rather than a full markdown renderer -- narrowly targets the one
// notation shape this content actually uses (a pipe through the next ket-bracket), not a general
// content-formatting system (the separate, already-flagged "2^N as plain text" limitation is a
// bigger ask -- explicitly out of scope here, would need a real markdown/LaTeX renderer).
const KET_NOTATION_PATTERN = /\|[^⟩]*⟩/g;
export function renderWithKetNotation(text) {
  const parts = text.split(KET_NOTATION_PATTERN);
  const matches = text.match(KET_NOTATION_PATTERN) ?? [];
  const nodes = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(part);
    if (matches[index]) {
      nodes.push(
        <span key={index} className="font-mono">
          {matches[index]}
        </span>
      );
    }
  });
  return nodes;
}

function LessonScreenContent({ screen, onPassed }) {
  if (screen.type === "explanation") {
    return (
      <div className="lesson-player__card lesson-player__card--explanation">
        <p className="lesson-player__explanation">{renderWithKetNotation(screen.content.text)}</p>
      </div>
    );
  }

  if (screen.type === "simulation") {
    return (
      <div className="lesson-player__card lesson-player__card--simulation">
        <QuestionRenderer type={screen.content.widgetType} params={screen.content.params} />
      </div>
    );
  }

  // screen.type === "question"
  const question = screen.questions?.[0];
  if (!question) {
    return <p className="lesson-player__explanation">This screen has no question attached.</p>;
  }

  async function handleSubmit(answer) {
    const result = await attemptService.submit({
      questionId: question.id,
      contextType: "screen",
      contextId: screen.id,
      answer,
    });
    // Next/Finish only unlocks on a correct answer -- an incorrect attempt leaves the widget's
    // own existing retry path (Try Again -> reset -> resubmit) as the only way forward, with no
    // artificial retry cap. Unlocking on any terminal state (including wrong) would make that
    // retry mechanism pointless.
    if (result.isCorrect) {
      onPassed(screen.id);
    }
    return result;
  }

  return <QuestionRenderer type={question.type} question={question} onSubmit={handleSubmit} />;
}
