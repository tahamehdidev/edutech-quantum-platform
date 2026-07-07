import { test, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useQuestionAttempt, ATTEMPT_STATUS } from "./useQuestionAttempt.js";

test("starts unattempted with no result or error", () => {
  const { result } = renderHook(() => useQuestionAttempt(vi.fn()));
  expect(result.current.state).toEqual({
    status: ATTEMPT_STATUS.UNATTEMPTED,
    result: null,
    error: null,
  });
});

test("moves to submitting as soon as submit() is called, before the promise resolves", async () => {
  let resolveSubmit;
  const submitFn = vi.fn(() => new Promise((resolve) => (resolveSubmit = resolve)));
  const { result } = renderHook(() => useQuestionAttempt(submitFn));

  act(() => {
    result.current.submit({ selectedOptionId: "a" });
  });

  expect(result.current.state.status).toBe(ATTEMPT_STATUS.SUBMITTING);
  expect(submitFn).toHaveBeenCalledWith({ selectedOptionId: "a" });

  await act(async () => resolveSubmit({ isCorrect: true, xpAwarded: true }));
});

test.each([
  [{ isCorrect: true, xpAwarded: true }, ATTEMPT_STATUS.CORRECT],
  [{ isCorrect: true, xpAwarded: false }, ATTEMPT_STATUS.CORRECT],
  [{ isCorrect: false, xpAwarded: true }, ATTEMPT_STATUS.INCORRECT],
  [{ isCorrect: false, xpAwarded: false }, ATTEMPT_STATUS.INCORRECT],
])(
  "resolves %j to status %s, carrying the result through untouched",
  async (apiResult, expectedStatus) => {
    const submitFn = vi.fn().mockResolvedValue(apiResult);
    const { result } = renderHook(() => useQuestionAttempt(submitFn));

    await act(async () => result.current.submit("some-answer"));

    expect(result.current.state.status).toBe(expectedStatus);
    expect(result.current.state.result).toEqual(apiResult);
    expect(result.current.state.error).toBeNull();
  }
);

test("moves to error status when submitFn rejects, without inventing a verdict", async () => {
  const submitError = new Error("Network request failed");
  const submitFn = vi.fn().mockRejectedValue(submitError);
  const { result } = renderHook(() => useQuestionAttempt(submitFn));

  await act(async () => result.current.submit("some-answer"));

  expect(result.current.state.status).toBe(ATTEMPT_STATUS.ERROR);
  expect(result.current.state.result).toBeNull();
  expect(result.current.state.error).toBe(submitError);
});

test.each([ATTEMPT_STATUS.CORRECT, ATTEMPT_STATUS.INCORRECT, ATTEMPT_STATUS.ERROR])(
  "reset() returns to unattempted from %s",
  async (terminalStatus) => {
    const submitFn =
      terminalStatus === ATTEMPT_STATUS.ERROR
        ? vi.fn().mockRejectedValue(new Error("boom"))
        : vi.fn().mockResolvedValue({ isCorrect: terminalStatus === ATTEMPT_STATUS.CORRECT });

    const { result } = renderHook(() => useQuestionAttempt(submitFn));
    await act(async () => result.current.submit("some-answer"));
    expect(result.current.state.status).toBe(terminalStatus);

    act(() => result.current.reset());

    expect(result.current.state).toEqual({
      status: ATTEMPT_STATUS.UNATTEMPTED,
      result: null,
      error: null,
    });
  }
);

test("does not assume anything about the answer's shape", async () => {
  const submitFn = vi.fn().mockResolvedValue({ isCorrect: true });
  const { result } = renderHook(() => useQuestionAttempt(submitFn));

  const dragOrderAnswer = ["step-3", "step-1", "step-2"];
  await act(async () => result.current.submit(dragOrderAnswer));

  expect(submitFn).toHaveBeenCalledWith(dragOrderAnswer);
});

test("waitFor also observes the terminal state (sanity check on the async flow)", async () => {
  const submitFn = vi.fn().mockResolvedValue({ isCorrect: false, xpAwarded: false });
  const { result } = renderHook(() => useQuestionAttempt(submitFn));

  act(() => {
    result.current.submit("x");
  });

  await waitFor(() => expect(result.current.state.status).toBe(ATTEMPT_STATUS.INCORRECT));
});
