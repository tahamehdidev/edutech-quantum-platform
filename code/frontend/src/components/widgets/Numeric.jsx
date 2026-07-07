import { useState } from "react";
import {
  useQuestionAttempt,
  ATTEMPT_STATUS,
  isAttemptTerminal,
  isAttemptLocked,
} from "../../hooks/useQuestionAttempt.js";
import { AttemptFeedback } from "./AttemptFeedback.jsx";
import { AttemptActions } from "./AttemptActions.jsx";
import "./Numeric.css";

// Numeric questions have nothing safe to reveal pre-attempt (question.service.js strips
// correctValue/tolerance entirely for learners), so question.content is always {} here -- this
// widget only ever renders question.prompt plus a bare input. Same onSubmit contract as Mcq: an
// opaque (answer) => Promise<{ isCorrect, xpAwarded }>, so this widget has no dependency on the
// service layer or on how/where the answer gets submitted.
export function Numeric({ question, onSubmit }) {
  const [rawValue, setRawValue] = useState("");
  const { state, submit, reset } = useQuestionAttempt(onSubmit);
  const isTerminal = isAttemptTerminal(state.status);
  const isLocked = isAttemptLocked(state.status);

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
    reset();
  }

  function handleRetrySubmission() {
    reset();
  }

  return (
    <form className="numeric" onSubmit={handleSubmit}>
      <label className="numeric__prompt" htmlFor={`numeric-${question.id}`}>
        {question.prompt}
      </label>
      <input
        id={`numeric-${question.id}`}
        className={[
          "numeric__input",
          showFormatHint && "numeric__input--invalid",
          isTerminal && state.status === ATTEMPT_STATUS.CORRECT && "numeric__input--correct",
          isTerminal && state.status === ATTEMPT_STATUS.INCORRECT && "numeric__input--incorrect",
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

      {showFormatHint && (
        <p id={formatHintId} className="numeric__hint">
          Enter a number to continue.
        </p>
      )}

      <AttemptFeedback status={state.status} result={state.result} />

      <AttemptActions
        status={state.status}
        onRetry={handleRetry}
        onRetrySubmission={handleRetrySubmission}
        isSubmitDisabled={!isValidNumber}
      />
    </form>
  );
}
