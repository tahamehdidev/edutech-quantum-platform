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
import "./Mcq.css";

// question.content is the learner-shaped { options } (question.service.js strips the answer
// server-side) -- this widget never sees or computes a correct answer, only reacts to what
// onSubmit's resolved/rejected value says. onSubmit is the caller's (answer) =>
// Promise<{ isCorrect, xpAwarded }> (typically attemptService.submit bound to this question's
// context) -- kept as an opaque prop, same contract useQuestionAttempt itself expects, so this
// widget has no import-time dependency on the service layer or on contextType/contextId at all.
export function Mcq({ question, onSubmit }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const { state, submit, reset } = useQuestionAttempt(onSubmit);
  const isTerminal = isAttemptTerminal(state.status);
  const isLocked = isAttemptLocked(state.status);

  function handleSubmit(event) {
    event.preventDefault();
    if (selectedIndex === null) return;
    submit({ selectedOptionIndex: selectedIndex });
  }

  // Wrong/right retry starts a genuinely new attempt (per-widget retry behavior is Milestone 6's
  // job, but clearing the prior selection here is the obvious minimum for "reset"). A submission
  // error is different -- nothing about the learner's answer was rejected, only the request
  // failed, so retrying keeps their selection and just re-arms the form for another submit().
  function handleRetry() {
    setSelectedIndex(null);
    reset();
  }

  function handleRetrySubmission() {
    reset();
  }

  return (
    <form className="mcq" onSubmit={handleSubmit}>
      <fieldset className="mcq__options" disabled={isLocked}>
        <legend className="mcq__prompt">{question.prompt}</legend>
        {question.content.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const showVerdict = isTerminal && isSelected;
          return (
            <label
              key={index}
              className={[
                "mcq__option",
                isSelected && "mcq__option--selected",
                showVerdict && state.status === ATTEMPT_STATUS.CORRECT && "mcq__option--correct",
                showVerdict &&
                  state.status === ATTEMPT_STATUS.INCORRECT &&
                  "mcq__option--incorrect",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name={`mcq-${question.id}`}
                value={index}
                checked={isSelected}
                onChange={() => setSelectedIndex(index)}
              />
              <span>{option}</span>
              {showVerdict && state.status === ATTEMPT_STATUS.CORRECT && (
                <Check
                  className="mcq__option-icon mcq__option-icon--correct"
                  size={18}
                  aria-hidden="true"
                />
              )}
              {showVerdict && state.status === ATTEMPT_STATUS.INCORRECT && (
                <X
                  className="mcq__option-icon mcq__option-icon--incorrect"
                  size={18}
                  aria-hidden="true"
                />
              )}
            </label>
          );
        })}
      </fieldset>

      <AttemptFeedback status={state.status} result={state.result} />

      <AttemptActions
        status={state.status}
        onRetry={handleRetry}
        onRetrySubmission={handleRetrySubmission}
        isSubmitDisabled={selectedIndex === null}
      />
    </form>
  );
}
