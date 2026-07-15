import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleCheckBig } from "lucide-react";
import { practiceSetService } from "../services/practiceSet.service.js";
import { attemptService } from "../services/attempt.service.js";
import { parseApiError } from "../utils/parseApiError.js";
import { Button } from "../components/ui/Button.jsx";
import { ProgressBar } from "../components/ui/ProgressBar.jsx";
import { QuestionRenderer } from "../components/ui/QuestionRenderer.jsx";
import "./PracticeSetPage.css";

export function PracticeSetPage() {
  const { practiceSetId } = useParams();
  const [practiceSet, setPracticeSet] = useState(null);
  // currentIndex ranges 0..questions.length inclusive -- questions.length itself is the
  // "practice complete" state (see LessonPlayerPage, where this replaced a separate isComplete
  // boolean during its own simplicity review).
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);
  const [passedQuestionIds, setPassedQuestionIds] = useState(() => new Set());
  // Every question is guaranteed correct by completion time (Next requires it) -- what's
  // actually informative for a repeatable drilling tool is whether any of them took more than
  // one try, not a "N/N correct" count that would always just read as 100%.
  const [retriedQuestionIds, setRetriedQuestionIds] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPracticeSet(null);
    setCurrentIndex(0);
    setMaxVisitedIndex(0);
    setPassedQuestionIds(new Set());
    setRetriedQuestionIds(new Set());

    async function load() {
      try {
        const result = await practiceSetService.getById(practiceSetId);
        if (cancelled) return;
        setPracticeSet(result);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [practiceSetId, loadAttempt]);

  const questions = practiceSet?.questions ?? [];
  const isComplete = currentIndex === questions.length;
  const currentQuestion = !isComplete ? questions[currentIndex] : null;
  const isNextDisabled = currentQuestion != null && !passedQuestionIds.has(currentQuestion.id);

  function markQuestionPassed(questionId) {
    setPassedQuestionIds((current) => new Set(current).add(questionId));
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setMaxVisitedIndex((current) => Math.max(current, nextIndex));
  }

  function handleBack() {
    setCurrentIndex((current) => Math.max(0, current - 1));
  }

  async function handleSubmit(question, answer) {
    const result = await attemptService.submit({
      questionId: question.id,
      contextType: "practice_set",
      contextId: practiceSet.id,
      answer,
    });
    // Same gate as Lesson Player: only a correct answer unlocks Next, with unlimited retries via
    // the widget's own existing "Try Again" path.
    if (result.isCorrect) {
      markQuestionPassed(question.id);
      // Only count retries incurred on the way to first passing a question -- a wrong answer on
      // a voluntary post-pass "Practice again" attempt isn't the struggle this summary reports on.
    } else if (!passedQuestionIds.has(question.id)) {
      setRetriedQuestionIds((current) => new Set(current).add(question.id));
    }
    return result;
  }

  if (error) {
    if (error.code === "NOT_FOUND") {
      // No practiceSet data ever loaded here (the fetch itself 404'd), so there's no lesson_id
      // to link back to -- the catalog is the safest known-good destination. Was navigate(-1)
      // (nav-flow audit: fragile on a direct/shared/refreshed URL with no useful history).
      return (
        <main className="practice-set">
          <p className="practice-set__not-found">{error.message}</p>
          <Link to="/courses" className="button button--secondary">
            Back to courses
          </Link>
        </main>
      );
    }
    return (
      <main className="practice-set">
        <p className="practice-set__banner" role="alert">
          {error.message}
        </p>
        <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</Button>
      </main>
    );
  }

  if (practiceSet === null) {
    return (
      <main className="practice-set">
        <div aria-hidden="true" className="practice-set__skeleton">
          <div className="practice-set__skeleton-line practice-set__skeleton-line--title" />
          <div className="practice-set__skeleton-line practice-set__skeleton-line--bar" />
          <div className="practice-set__skeleton-line" />
          <div className="practice-set__skeleton-line practice-set__skeleton-line--short" />
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="practice-set">
        <Link to={`/lessons/${practiceSet.lesson_id}`} className="practice-set__exit">
          <ChevronLeft size={16} aria-hidden="true" />
          Exit practice
        </Link>
        <h1>{practiceSet.title}</h1>
        <p className="practice-set__not-found">This practice set has no questions yet.</p>
      </main>
    );
  }

  return (
    <main className="practice-set">
      {/* Was navigate(-1) (nav-flow audit: history-based, fragile on a direct/shared/refreshed
          URL) -- a real link to the practice set's own lesson, always reachable regardless of
          how the visitor arrived here. */}
      <Link to={`/lessons/${practiceSet.lesson_id}`} className="practice-set__exit">
        <ChevronLeft size={16} aria-hidden="true" />
        Exit practice
      </Link>
      <h1>{practiceSet.title}</h1>
      <ProgressBar value={currentIndex + 1} max={questions.length} label="Practice progress" />
      {!isComplete ? (
        <p className="practice-set__step-count" aria-live="polite">
          Question {currentIndex + 1} of {questions.length}
        </p>
      ) : null}

      {questions.slice(0, maxVisitedIndex + 1).map((question, index) => (
        <div
          key={question.id}
          hidden={isComplete || index !== currentIndex}
          className="practice-set__question"
        >
          <QuestionRenderer
            type={question.type}
            question={question}
            onSubmit={(answer) => handleSubmit(question, answer)}
          />
        </div>
      ))}
      {isComplete ? (
        <div className="practice-set__complete" role="status">
          {/* Same reasoning as Lesson Player's completion moment: a check-circle signals genuine
              completion without PartyPopper's gamified-microlearning connotation. */}
          <CircleCheckBig size={32} aria-hidden="true" />
          <p className="practice-set__complete-heading">Practice complete!</p>
          <p className="practice-set__complete-summary">
            {retriedQuestionIds.size === 0
              ? "No mistakes — nice work!"
              : `You got there — ${retriedQuestionIds.size} of ${questions.length} took a retry.`}
          </p>
          <Link to={`/lessons/${practiceSet.lesson_id}`} className="button button--primary">
            Back to lesson
          </Link>
        </div>
      ) : null}

      <div className="practice-set__nav">
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
            {currentIndex === questions.length - 1 ? "Finish practice" : "Next"}
            {currentIndex !== questions.length - 1 ? (
              <ChevronRight size={16} aria-hidden="true" />
            ) : null}
          </Button>
        ) : null}
      </div>
    </main>
  );
}
