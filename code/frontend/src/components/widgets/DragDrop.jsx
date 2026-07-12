import { useState } from "react";
import { GripVertical, ArrowUp, ArrowDown, Check, X } from "lucide-react";
import {
  useQuestionAttempt,
  ATTEMPT_STATUS,
  isAttemptTerminal,
  isAttemptLocked,
} from "../../hooks/useQuestionAttempt.js";
import { AttemptFeedback } from "./AttemptFeedback.jsx";
import { AttemptActions } from "./AttemptActions.jsx";
import "./DragDrop.css";

// Remove-and-reinsert -- the one reorder primitive both input paths need. A swap (trading two
// positions, leaving everything between them untouched) only happens to look right for adjacent
// moves; dragging or moving a non-adjacent item must shift the items in between, which this does
// correctly in both cases (an adjacent from/to produces the exact same result a swap would).
function reorderByInsert(order, fromPosition, toPosition) {
  const next = [...order];
  const [moved] = next.splice(fromPosition, 1);
  next.splice(toPosition, 0, moved);
  return next;
}

// question.content is the learner-shaped { items } (question.service.js strips correctOrder
// entirely) -- this widget never knows the right order, only reacts to what onSubmit's
// resolved/rejected value says. Same opaque onSubmit contract as Mcq/Numeric.
//
// `order` holds the current arrangement as a permutation of indices into question.content.items
// (starting as the identity permutation, i.e. the given display order) -- attempt.service.js's
// gradeAnswer compares this same shape positionally against content.correctOrder.
//
// Reordering has two independent, equally real input paths, not one primary and one fallback:
// native HTML5 drag-and-drop for mouse/trackpad, and always-visible Move Up/Down buttons, which
// are also what keyboard and touch users need (PRODUCT.md's accessibility section requires a
// keyboard-operable alternative for this widget specifically).
export function DragDrop({ question, onSubmit }) {
  const [order, setOrder] = useState(() => question.content.items.map((_, index) => index));
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const { state, submit, reset } = useQuestionAttempt(onSubmit);
  const isLocked = isAttemptLocked(state.status);
  const isTerminal = isAttemptTerminal(state.status);
  const isCorrect = isTerminal && state.status === ATTEMPT_STATUS.CORRECT;
  const isIncorrect = isTerminal && state.status === ATTEMPT_STATUS.INCORRECT;

  function handleSubmit(event) {
    event.preventDefault();
    submit({ order });
  }

  // Same split as Mcq/Numeric: a graded wrong answer starts fresh (back to the original display
  // order), but a submission that never reached the server didn't reject the arrangement, so
  // retrying keeps it.
  function handleRetry() {
    setOrder(question.content.items.map((_, index) => index));
    setIsRevealed(false);
    reset();
  }

  function handleRetrySubmission() {
    reset();
  }

  function handleReveal() {
    setIsRevealed(true);
  }

  function handleDrop(targetPosition) {
    if (draggedPosition === null || draggedPosition === targetPosition) return;
    setOrder(reorderByInsert(order, draggedPosition, targetPosition));
    setDraggedPosition(null);
  }

  return (
    <form className="drag-drop" onSubmit={handleSubmit}>
      <p className="drag-drop__prompt">{question.prompt}</p>
      <p className="drag-drop__instructions">Drag to reorder, or use the up/down buttons.</p>

      <div
        className={[
          "drag-drop__list-wrapper",
          isCorrect && "drag-drop__list-wrapper--correct",
          isIncorrect && "drag-drop__list-wrapper--incorrect",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* A verdict on the list itself (Frontend Milestone 6), matching Mcq's per-option
            check/X and Numeric's icon -- previously this widget's only terminal-state signal was
            the shared AttemptFeedback text below. Presentational, not role="status": that text
            below already owns the one accessible announcement per outcome, so this doesn't
            duplicate it for screen-reader users while still giving sighted users scanning the
            list a same-tier signal to the other two widgets. */}
        {isTerminal && (
          <p className="drag-drop__verdict">
            {isCorrect ? (
              <Check
                className="drag-drop__verdict-icon drag-drop__verdict-icon--correct"
                size={16}
                aria-hidden="true"
              />
            ) : (
              <X
                className="drag-drop__verdict-icon drag-drop__verdict-icon--incorrect"
                size={16}
                aria-hidden="true"
              />
            )}
            {isCorrect ? "Correct order" : "Not the correct order"}
          </p>
        )}

        <ol className="drag-drop__list">
          {order.map((itemIndex, position) => {
            const label = question.content.items[itemIndex];
            return (
              <li
                key={itemIndex}
                className={
                  position === draggedPosition
                    ? "drag-drop__item drag-drop__item--dragging"
                    : "drag-drop__item"
                }
                draggable={!isLocked}
                onDragStart={() => setDraggedPosition(position)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(position)}
                onDragEnd={() => setDraggedPosition(null)}
              >
                <GripVertical className="drag-drop__handle" size={18} aria-hidden="true" />
                <span className="drag-drop__label">{label}</span>
                <div className="drag-drop__move-buttons">
                  <button
                    type="button"
                    className="drag-drop__move-button"
                    aria-label={`Move "${label}" up`}
                    disabled={isLocked || position === 0}
                    onClick={() => setOrder(reorderByInsert(order, position, position - 1))}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="drag-drop__move-button"
                    aria-label={`Move "${label}" down`}
                    disabled={isLocked || position === order.length - 1}
                    onClick={() => setOrder(reorderByInsert(order, position, position + 1))}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* role="status" so screen reader users get the same "something just appeared" signal
          sighted users get for free from the list becoming visible (critique finding). */}
      {isRevealed && state.result?.correctAnswer && (
        <div className="drag-drop__reveal" role="status">
          <p className="drag-drop__reveal-label">Correct order:</p>
          <ol className="drag-drop__reveal-list">
            {state.result.correctAnswer.order.map((itemIndex) => (
              <li key={itemIndex}>{question.content.items[itemIndex]}</li>
            ))}
          </ol>
        </div>
      )}

      <AttemptFeedback status={state.status} result={state.result} />

      <AttemptActions
        status={state.status}
        onRetry={handleRetry}
        onRetrySubmission={handleRetrySubmission}
        onReveal={handleReveal}
        isRevealed={isRevealed}
      />
    </form>
  );
}
