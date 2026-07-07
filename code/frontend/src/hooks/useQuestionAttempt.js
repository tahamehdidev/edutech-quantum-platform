import { useReducer, useCallback } from "react";

export const ATTEMPT_STATUS = {
  UNATTEMPTED: "unattempted",
  SUBMITTING: "submitting",
  CORRECT: "correct",
  INCORRECT: "incorrect",
  ERROR: "error",
};

const initialState = {
  status: ATTEMPT_STATUS.UNATTEMPTED,
  result: null,
  error: null,
};

// The graded/ungraded-input distinction every widget needs to derive from `state.status` --
// colocated with ATTEMPT_STATUS rather than reimplemented per widget (Mcq/Numeric/DragDrop all
// had their own copy of both checks before this was extracted).
export function isAttemptTerminal(status) {
  return status === ATTEMPT_STATUS.CORRECT || status === ATTEMPT_STATUS.INCORRECT;
}

export function isAttemptLocked(status) {
  return isAttemptTerminal(status) || status === ATTEMPT_STATUS.SUBMITTING;
}

// Grading itself is server-only (02-api-contract.md) -- this reducer never inspects an answer,
// only the shape of what submitFn resolves/rejects with. `result` is passed through untouched so
// callers can read whatever fields the real response carries (isCorrect, xpAwarded, ...) without
// the reducer having to know their names beyond the one it branches on.
function attemptReducer(state, action) {
  switch (action.type) {
    case "SUBMIT_START":
      return { status: ATTEMPT_STATUS.SUBMITTING, result: null, error: null };
    case "SUBMIT_SUCCESS":
      return {
        status: action.result.isCorrect ? ATTEMPT_STATUS.CORRECT : ATTEMPT_STATUS.INCORRECT,
        result: action.result,
        error: null,
      };
    case "SUBMIT_ERROR":
      return { status: ATTEMPT_STATUS.ERROR, result: null, error: action.error };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// Generic question-interaction state machine (Frontend Milestone 3). Every widget in Milestone 4
// -- MCQ, numeric, drag-to-order, topology diagram, amplitude bar chart, Bloch sphere -- drives
// its own answer-collection UI, then calls submit(answer) and reacts to `state.status`/
// `state.result`. `submitFn` is the caller's own (answer) => Promise<{ isCorrect, xpAwarded }>
// (typically attemptService.submit bound to a question's id/context) -- this hook treats it as
// opaque, so it never has to branch on question type or answer shape.
//
// Callers are expected to disable answer input while status is "submitting"; this hook has no
// extra guard against overlapping submit() calls, since normal UI usage never produces one.
export function useQuestionAttempt(submitFn) {
  const [state, dispatch] = useReducer(attemptReducer, initialState);

  const submit = useCallback(
    async (answer) => {
      dispatch({ type: "SUBMIT_START" });
      try {
        const result = await submitFn(answer);
        dispatch({ type: "SUBMIT_SUCCESS", result });
      } catch (error) {
        dispatch({ type: "SUBMIT_ERROR", error });
      }
    },
    [submitFn]
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, submit, reset };
}
