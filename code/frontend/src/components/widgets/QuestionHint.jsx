import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import "./QuestionHint.css";

// Shared across Mcq/Numeric/DragDrop, same reason AttemptFeedback/AttemptActions are: identical
// behavior everywhere a question can appear, one implementation instead of three copies that
// could drift. Renders nothing when the question has no hint authored -- most questions won't,
// at least until the pilot chapter's content is written, and a widget with no toggle to show is
// simpler than a disabled one. Reuses Button (secondary variant, same as AttemptActions' "See
// answer") rather than a bespoke control, for free touch-target sizing and consistent styling.
//
// Not gated by attempt status (unlike AttemptActions' Submit/Retry buttons): a hint is safe to
// read before, during, or after answering, so there's no state to reset it against.
export function QuestionHint({ hint }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!hint) return null;

  return (
    <div className="question-hint">
      <Button
        type="button"
        variant="secondary"
        className="question-hint__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <Lightbulb size={16} aria-hidden="true" />
        {isOpen ? "Hide hint" : "Show hint"}
      </Button>
      {isOpen && (
        <p className="question-hint__text" role="status">
          {hint}
        </p>
      )}
    </div>
  );
}
