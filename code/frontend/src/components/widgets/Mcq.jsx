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
  const [eliminatedIndices, setEliminatedIndices] = useState(() => new Set());
  const [isRevealed, setIsRevealed] = useState(false);
  const { state, submit, reset } = useQuestionAttempt(onSubmit);
  const isTerminal = isAttemptTerminal(state.status);
  const isLocked = isAttemptLocked(state.status);

  function handleSubmit(event) {
    event.preventDefault();
    if (selectedIndex === null) return;
    submit({ selectedOptionIndex: selectedIndex });
  }

  // A wrong retry eliminates the just-submitted option from future selection (Frontend Milestone
  // 6, matching the real Brilliant.org precedent observed for Task 1) -- process-of-elimination
  // across retries, not a blank-slate reset every time. Accumulates in eliminatedIndices, which
  // naturally starts empty per question since each question mounts its own Mcq instance. A
  // correct retry (re-attempting an already-passed question) and a submission error are both
  // different: nothing was eliminated, so eliminatedIndices is untouched either way.
  function handleRetry() {
    if (state.status === ATTEMPT_STATUS.INCORRECT && selectedIndex !== null) {
      setEliminatedIndices((prev) => new Set(prev).add(selectedIndex));
    }
    setSelectedIndex(null);
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
    <form className="mcq" onSubmit={handleSubmit}>
      <fieldset className="mcq__options" disabled={isLocked}>
        <legend className="mcq__prompt">{question.prompt}</legend>
        {question.content.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isEliminated = eliminatedIndices.has(index);
          const showSelectedVerdict = isTerminal && isSelected;
          // Revealed correct answer is independent of selection -- it's often a *different*
          // option than the one the learner picked (that's the point of revealing it).
          const isRevealedCorrect =
            isRevealed && state.result?.correctAnswer?.selectedOptionIndex === index;
          const showCorrect =
            (showSelectedVerdict && state.status === ATTEMPT_STATUS.CORRECT) || isRevealedCorrect;
          const showIncorrect = showSelectedVerdict && state.status === ATTEMPT_STATUS.INCORRECT;
          const eliminatedHintId = `mcq-${question.id}-eliminated-${index}`;
          return (
            // A fragment, not just <label>, so the visually-hidden hint span below can sit
            // outside the label -- inside it, its text would concatenate into the label's own
            // text content and change what getByLabelText(optionText) (and a real screen
            // reader's accessible *name*, not just description) resolves to. aria-describedby
            // works by id reference regardless of DOM position, so this doesn't weaken it.
            <div className="mcq__option-wrapper" key={index}>
              <label
                className={[
                  "mcq__option",
                  isSelected && "mcq__option--selected",
                  showCorrect && "mcq__option--correct",
                  showIncorrect && "mcq__option--incorrect",
                  isEliminated && "mcq__option--eliminated",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name={`mcq-${question.id}`}
                  value={index}
                  checked={isSelected}
                  disabled={isEliminated}
                  title={isEliminated ? "Already tried -- incorrect" : undefined}
                  aria-describedby={isEliminated ? eliminatedHintId : undefined}
                  onChange={() => setSelectedIndex(index)}
                />
                <span>{option}</span>
                {showCorrect && (
                  <Check
                    className="mcq__option-icon mcq__option-icon--correct"
                    size={18}
                    aria-hidden="true"
                  />
                )}
                {(showIncorrect || isEliminated) && (
                  <X
                    className="mcq__option-icon mcq__option-icon--incorrect"
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </label>
              {/* Sighted users read "grayed + X" as "already tried" from context; a screen
                  reader hitting a disabled control gets no such context for free (critique
                  finding, confirmed independently by both review passes). This is a
                  *description* (aria-describedby above), not the option's accessible name. */}
              {isEliminated && (
                <span id={eliminatedHintId} className="visually-hidden">
                  Already tried -- incorrect
                </span>
              )}
            </div>
          );
        })}
      </fieldset>

      {/* Sighted users see the correct option turn green above; this is the equivalent
          announcement for screen reader users, who get no signal otherwise that clicking "See
          answer" did anything (critique finding). Visually hidden since the highlight already
          carries the information for sighted users. */}
      {isRevealed && state.result?.correctAnswer && (
        <p role="status" className="visually-hidden">
          Correct answer: {question.content.options[state.result.correctAnswer.selectedOptionIndex]}
        </p>
      )}

      <AttemptFeedback status={state.status} result={state.result} />

      <AttemptActions
        status={state.status}
        onRetry={handleRetry}
        onRetrySubmission={handleRetrySubmission}
        onReveal={handleReveal}
        isRevealed={isRevealed}
        isSubmitDisabled={selectedIndex === null}
      />
    </form>
  );
}
