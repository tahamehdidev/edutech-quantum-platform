import { ATTEMPT_STATUS, isAttemptTerminal } from "../../hooks/useQuestionAttempt.js";
import { Button } from "../ui/Button.jsx";
import "./AttemptActions.css";

// The three-way retry/submit ternary, identical across Mcq/Numeric/DragDrop before this was
// extracted. What "retry" actually resets is genuinely per-widget (a selected option, a typed
// value, an item order) -- onRetry/onRetrySubmission stay the caller's own callbacks; this
// component only owns which button to show and its label/disabled/loading state.
//
// onReveal/isRevealed (Frontend Milestone 6) follow the same boundary: "See answer" only shows on
// an incorrect, not-yet-revealed attempt, and this component's only job is showing/hiding that
// button. What gets revealed -- highlighting an option, showing a value, showing an order -- is
// entirely per-widget and deliberately does not live here, the same reason onRetry's actual reset
// logic doesn't either.
export function AttemptActions({
  status,
  onRetry,
  onRetrySubmission,
  onReveal,
  isRevealed,
  isSubmitDisabled,
}) {
  if (status === ATTEMPT_STATUS.INCORRECT) {
    return (
      <div className="attempt-actions">
        {!isRevealed && (
          <Button type="button" variant="secondary" onClick={onReveal}>
            See answer
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  // Only ATTEMPT_STATUS.CORRECT reaches here in practice -- INCORRECT is already handled above,
  // and isAttemptTerminal covers exactly those two values. Distinct copy from the incorrect
  // branch's "Try Again" (critique finding): identical wording/styling on a correct answer read as
  // competing with the primary Next/Finish CTA at the flow's actual reward moment, implying
  // something needed fixing when it didn't -- this is optional extra practice, not a correction.
  if (isAttemptTerminal(status)) {
    return (
      <div className="attempt-actions">
        <Button type="button" variant="secondary" onClick={onRetry}>
          Practice again
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
