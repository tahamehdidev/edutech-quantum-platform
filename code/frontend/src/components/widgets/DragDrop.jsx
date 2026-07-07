import { useState } from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { useQuestionAttempt, isAttemptLocked } from "../../hooks/useQuestionAttempt.js";
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
  const { state, submit, reset } = useQuestionAttempt(onSubmit);
  const isLocked = isAttemptLocked(state.status);

  function handleSubmit(event) {
    event.preventDefault();
    submit({ order });
  }

  // Same split as Mcq/Numeric: a graded wrong answer starts fresh (back to the original display
  // order), but a submission that never reached the server didn't reject the arrangement, so
  // retrying keeps it.
  function handleRetry() {
    setOrder(question.content.items.map((_, index) => index));
    reset();
  }

  function handleRetrySubmission() {
    reset();
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

      <AttemptFeedback status={state.status} result={state.result} />

      <AttemptActions
        status={state.status}
        onRetry={handleRetry}
        onRetrySubmission={handleRetrySubmission}
      />
    </form>
  );
}
