import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  useQuestionAttempt,
  ATTEMPT_STATUS,
  isAttemptTerminal,
  isAttemptLocked,
} from "../../hooks/useQuestionAttempt.js";
import { AttemptFeedback } from "./AttemptFeedback.jsx";
import { AttemptActions } from "./AttemptActions.jsx";
import { QuestionHint } from "./QuestionHint.jsx";
import "./Numeric.css";

// Numeric questions have nothing safe to reveal pre-attempt (question.service.js strips
// correctValue/tolerance entirely for learners), so question.content is always {} here -- this
// widget only ever renders question.prompt plus a bare input. Same onSubmit contract as Mcq: an
// opaque (answer) => Promise<{ isCorrect, xpAwarded }>, so this widget has no dependency on the
// service layer or on how/where the answer gets submitted.
export function Numeric({ question, onSubmit }) {
  const [rawValue, setRawValue] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const { state, submit, reset } = useQuestionAttempt(onSubmit);
  const isTerminal = isAttemptTerminal(state.status);
  const isLocked = isAttemptLocked(state.status);
  const isCorrect = isTerminal && state.status === ATTEMPT_STATUS.CORRECT;
  const isIncorrect = isTerminal && state.status === ATTEMPT_STATUS.INCORRECT;

  // Client-side format validation only -- whether the number is *correct* is entirely the
  // server's call (attempt.service.js's gradeAnswer), this just guards against submitting
  // something that isn't a number at all (blank, "-", "1.2.3", ...).
  const trimmedValue = rawValue.trim();
  const parsedValue = Number(trimmedValue);
  const isValidNumber = trimmedValue !== "" && Number.isFinite(parsedValue);
  const showFormatHint = trimmedValue !== "" && !isValidNumber;
  const formatHintId = `numeric-${question.id}-hint`;

  function handleSubmit(event) {
    event.preventDefault();
    if (!isValidNumber) return;
    submit({ value: parsedValue });
  }

  // Same split as Mcq: a graded wrong answer starts fresh (clear the input), but a submission
  // that never reached the server didn't reject the learner's answer, so retrying keeps it.
  function handleRetry() {
    setRawValue("");
    setIsRevealed(false);
    reset();
  }

  function handleRetrySubmission() {
    reset();
  }

  function handleReveal() {
    setIsRevealed(true);
  }

  return (
    <form className="numeric" onSubmit={handleSubmit}>
      <label className="numeric__prompt" htmlFor={`numeric-${question.id}`}>
        {question.prompt}
      </label>

      <QuestionHint hint={question.hint} />

      <div className="numeric__input-row">
        <input
          id={`numeric-${question.id}`}
          className={[
            "numeric__input",
            showFormatHint && "numeric__input--invalid",
            isCorrect && "numeric__input--correct",
            isIncorrect && "numeric__input--incorrect",
          ]
            .filter(Boolean)
            .join(" ")}
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={(event) => setRawValue(event.target.value)}
          disabled={isLocked}
          aria-invalid={showFormatHint}
          aria-describedby={showFormatHint ? formatHintId : undefined}
        />
        {/* Icon parity with Mcq's per-option check/X and DragDrop's list verdict (Frontend
            Milestone 6) -- the border recolor alone repeated WCAG's own color-not-only rule that
            every other terminal-state indicator in this project already follows. */}
        {isCorrect && (
          <Check className="numeric__icon numeric__icon--correct" size={18} aria-hidden="true" />
        )}
        {isIncorrect && (
          <X className="numeric__icon numeric__icon--incorrect" size={18} aria-hidden="true" />
        )}
      </div>

      {showFormatHint && (
        <p id={formatHintId} className="numeric__hint">
          Enter a number to continue.
        </p>
      )}

      {/* role="status" so screen reader users get the same "something just appeared" signal
          sighted users get for free from the text becoming visible (critique finding). */}
      {isRevealed && state.result?.correctAnswer && (
        <p role="status" className="numeric__reveal">
          Correct answer: {state.result.correctAnswer.value}
        </p>
      )}

      <AttemptFeedback status={state.status} result={state.result} />

      <AttemptActions
        status={state.status}
        onRetry={handleRetry}
        onRetrySubmission={handleRetrySubmission}
        onReveal={handleReveal}
        isRevealed={isRevealed}
        isSubmitDisabled={!isValidNumber}
      />
    </form>
  );
}
