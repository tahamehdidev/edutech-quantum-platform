import { Check, X, TriangleAlert } from "lucide-react";
import { ATTEMPT_STATUS } from "../../hooks/useQuestionAttempt.js";
import "./AttemptFeedback.css";

// Identical across Mcq/Numeric/DragDrop before this was extracted (Frontend Milestone 4, widget
// 3's simplicity review) -- the icon+text+role pairing per outcome is the one thing that must
// never drift between widgets, so it now has exactly one implementation. `result` is only read
// for `xpAwarded`; everything else about grading stays the server's business.
export function AttemptFeedback({ status, result }) {
  if (status === ATTEMPT_STATUS.ERROR) {
    return (
      <p className="attempt-feedback attempt-feedback--error" role="alert">
        <TriangleAlert size={16} aria-hidden="true" />
        Could not submit your answer. Please try again.
      </p>
    );
  }

  if (status === ATTEMPT_STATUS.CORRECT) {
    return (
      <p className="attempt-feedback attempt-feedback--correct" role="status">
        <Check size={16} aria-hidden="true" />
        Correct! {result.xpAwarded ? "XP awarded." : "You already earned XP for this question."}
      </p>
    );
  }

  if (status === ATTEMPT_STATUS.INCORRECT) {
    return (
      <p className="attempt-feedback attempt-feedback--incorrect" role="status">
        <X size={16} aria-hidden="true" />
        Not quite — try again.
      </p>
    );
  }

  return null;
}
