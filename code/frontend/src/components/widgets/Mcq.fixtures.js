// Mock question content shaped exactly like a learner-facing GET response -- Question.content's
// answer field (correctOptionIndex) is stripped server-side (question.service.js) and never sent
// to the client, so it deliberately does not appear here either.
export const mcqQuestion = {
  id: 101,
  prompt: "Which of these correctly describes the Hadamard gate's effect on |0⟩?",
  content: {
    options: [
      "It leaves |0⟩ unchanged.",
      "It creates an equal superposition of |0⟩ and |1⟩.",
      "It flips |0⟩ to |1⟩ exactly.",
      "It applies a phase of -1 to |0⟩.",
    ],
  },
};

// Only the outcomes submitAttempt() can actually produce (attempt.service.js's shouldAwardXp --
// xpAwarded can never be true when isCorrect is false) plus a network failure, so both the
// automated test and the manual demo exercise realistic API behavior.
export const mcqSubmitScenarios = {
  correctFirstAttempt: () => Promise.resolve({ isCorrect: true, xpAwarded: true }),
  correctAlreadyEarnedXp: () => Promise.resolve({ isCorrect: true, xpAwarded: false }),
  incorrect: () => Promise.resolve({ isCorrect: false, xpAwarded: false }),
  networkError: () =>
    Promise.reject(new Error("Could not reach the server. Check your connection.")),
};
