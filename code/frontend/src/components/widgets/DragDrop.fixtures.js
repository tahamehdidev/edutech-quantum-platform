// Learner-shaped content only ever carries { items } -- question.service.js's stripAnswerFields
// strips correctOrder entirely, so the widget never has a "right answer" to check itself against.
// items is deliberately not pre-sorted -- this is the display/starting order the learner rearranges.
export const dragDropQuestion = {
  id: 301,
  prompt:
    "Order these encoding strategies from fewest qubits required to most qubits required, for the same 8-feature dataset.",
  content: {
    items: ["Basis Encoding", "Amplitude Encoding", "Angle Encoding"],
  },
};

// Only the outcomes submitAttempt() can actually produce, same reasoning as the other widgets'
// fixtures.
export const dragDropSubmitScenarios = {
  correctFirstAttempt: () => Promise.resolve({ isCorrect: true, xpAwarded: true }),
  correctAlreadyEarnedXp: () => Promise.resolve({ isCorrect: true, xpAwarded: false }),
  // correctAnswer mirrors the real API's conditional field (attempt.service.js) -- present only
  // on an incorrect result, shaped like the submitted answer ({ order: [...] }).
  incorrect: () =>
    Promise.resolve({ isCorrect: false, xpAwarded: false, correctAnswer: { order: [1, 2, 0] } }),
  networkError: () =>
    Promise.reject(new Error("Could not reach the server. Check your connection.")),
};
