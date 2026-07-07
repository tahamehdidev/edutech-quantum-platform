import { ATTEMPT_STATUS, isAttemptTerminal } from "../../hooks/useQuestionAttempt.js";
import { Button } from "../ui/Button.jsx";
import "./AttemptActions.css";

// The three-way retry/submit ternary, identical across Mcq/Numeric/DragDrop before this was
// extracted. What "retry" actually resets is genuinely per-widget (a selected option, a typed
// value, an item order) -- onRetry/onRetrySubmission stay the caller's own callbacks; this
// component only owns which button to show and its label/disabled/loading state.
export function AttemptActions({ status, onRetry, onRetrySubmission, isSubmitDisabled }) {
  if (isAttemptTerminal(status)) {
    return (
      <div className="attempt-actions">
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  if (status === ATTEMPT_STATUS.ERROR) {
    return (
      <div className="attempt-actions">
        <Button type="button" variant="secondary" onClick={onRetrySubmission}>
          Retry Submission
        </Button>
      </div>
    );
  }

  return (
    <div className="attempt-actions">
      <Button
        type="submit"
        isLoading={status === ATTEMPT_STATUS.SUBMITTING}
        disabled={isSubmitDisabled}
      >
        Submit
      </Button>
    </div>
  );
}
