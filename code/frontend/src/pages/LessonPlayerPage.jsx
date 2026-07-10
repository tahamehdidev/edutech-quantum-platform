import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { lessonService } from "../services/lesson.service.js";
import { screenService } from "../services/screen.service.js";
import { practiceSetService } from "../services/practiceSet.service.js";
import { attemptService } from "../services/attempt.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Button } from "../components/ui/Button.jsx";
import { ProgressBar } from "../components/ui/ProgressBar.jsx";
import { QuestionRenderer } from "../components/ui/QuestionRenderer.jsx";
import "./LessonPlayerPage.css";

export function LessonPlayerPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [screens, setScreens] = useState(null);
  const [practiceSets, setPracticeSets] = useState([]);
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
      return (
        <main className="lesson-player">
          <p className="lesson-player__not-found">{error.message}</p>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
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
        <button type="button" className="lesson-player__exit" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} aria-hidden="true" />
          Exit lesson
        </button>
        <h1>{lesson.title}</h1>
        <p className="lesson-player__not-found">This lesson has no content yet.</p>
      </main>
    );
  }

  return (
    <main className="lesson-player">
      <button type="button" className="lesson-player__exit" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} aria-hidden="true" />
        Exit lesson
      </button>
      <h1>{lesson.title}</h1>
      <ProgressBar value={currentIndex + 1} max={screens.length} label="Lesson progress" />
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
          <PartyPopper size={32} aria-hidden="true" />
          <p>Lesson complete!</p>
          {practiceSets.length > 0 ? (
            <Link to={`/practice-sets/${practiceSets[0].id}`} className="button button--primary">
              Practice this lesson
            </Link>
          ) : null}
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
    </main>
  );
}

function LessonScreenContent({ screen, onPassed }) {
  if (screen.type === "explanation") {
    return <p className="lesson-player__explanation">{screen.content.text}</p>;
  }

  if (screen.type === "simulation") {
    return (
      <QuestionRenderer type={screen.content.widgetType} params={screen.content.params} />
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
