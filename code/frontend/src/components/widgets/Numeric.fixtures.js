// Numeric questions have nothing safe to reveal pre-attempt (question.service.js stripAnswerFields
// -- no correctValue/tolerance hint), so the learner-shaped content is genuinely empty.
export const numericQuestion = {
  id: 201,
  prompt: "A qubit is measured in the computational basis. If P(|0⟩) = 0.36, what is P(|1⟩)?",
  content: {},
};

// Only outcomes submitAttempt() can actually produce, same reasoning as Mcq.fixtures.js.
export const numericSubmitScenarios = {
  correctFirstAttempt: () => Promise.resolve({ isCorrect: true, xpAwarded: true }),
  correctAlreadyEarnedXp: () => Promise.resolve({ isCorrect: true, xpAwarded: false }),
  incorrect: () => Promise.resolve({ isCorrect: false, xpAwarded: false }),
  networkError: () =>
    Promise.reject(new Error("Could not reach the server. Check your connection.")),
};
