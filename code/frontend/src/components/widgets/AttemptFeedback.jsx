import { Check, X, TriangleAlert, Zap } from "lucide-react";
import { ATTEMPT_STATUS } from "../../hooks/useQuestionAttempt.js";
import "./AttemptFeedback.css";

// Identical across Mcq/Numeric/DragDrop before this was extracted (Frontend Milestone 4, widget
// 3's simplicity review) -- the icon+text+role pairing per outcome is the one thing that must
// never drift between widgets, so it now has exactly one implementation. `result` is only read
// for `xpAwarded`; everything else about grading stays the server's business.
//
// xpAwarded gets its own visually distinct badge (Frontend Milestone 6), not just different
// wording -- the two CORRECT outcomes previously read identically at a glance (same icon, same
// color, same sentence shape), which is exactly the "xpAwarded visual distinction" gap the
// milestone's shape brief flagged. Zap/--color-warning matches XpStreakBadge's own XP treatment
// (ui/XpStreakBadge.jsx) rather than inventing a second visual language for the same concept.
// Explanation rides along on both outcomes (attempt.service.js sends it unconditionally) --
// "why" is worth reading whether the learner reasoned it out correctly or just guessed right, not
// only on a miss. A separate block below the verdict line rather than folded into it: the verdict
// is a short, scannable status; the explanation is prose, and conflating the two would make the
// one-line verdict wrap unpredictably across widgets with different-width feedback areas.
function Explanation({ explanation }) {
  if (!explanation) return null;
  return <p className="attempt-feedback__explanation">{explanation}</p>;
}

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
      <div>
        <p className="attempt-feedback attempt-feedback--correct" role="status">
          <Check size={16} aria-hidden="true" />
          <span>Correct!</span>{" "}
          {result.xpAwarded ? (
            <span className="attempt-feedback__xp-badge">
              <Zap size={12} aria-hidden="true" />
              XP awarded
            </span>
          ) : (
            <span>You already earned XP for this question.</span>
          )}
        </p>
        <Explanation explanation={result.explanation} />
      </div>
    );
  }

  if (status === ATTEMPT_STATUS.INCORRECT) {
    return (
      <div>
        <p className="attempt-feedback attempt-feedback--incorrect" role="status">
          <X size={16} aria-hidden="true" />
          Not quite — try again.
        </p>
        <Explanation explanation={result?.explanation} />
      </div>
    );
  }

  return null;
}
