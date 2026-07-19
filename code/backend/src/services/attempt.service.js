import { questionRepository } from "../repositories/question.repository.js";
import { screenRepository } from "../repositories/screen.repository.js";
import { practiceSetRepository } from "../repositories/practiceSet.repository.js";
import { screenQuestionRepository } from "../repositories/screenQuestion.repository.js";
import { practiceSetQuestionRepository } from "../repositories/practiceSetQuestion.repository.js";
import { attemptRepository } from "../repositories/attempt.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";
import { courseRepository } from "../repositories/course.repository.js";
import { validateAnswer } from "../validators/attempt.validator.js";
import { NotFoundError, ContextMismatchError } from "../errors/index.js";

// Not specified anywhere in 01-data-model.md/02-api-contract.md -- a flat per-correct-answer
// amount, easy to change later since nothing else derives from this specific number.
const XP_PER_CORRECT_ANSWER = 10;

// Attempt.context_type is polymorphic across exactly these two tables (01-data-model.md) --
// centralized here rather than a contextType === "screen" ? ... : ... ternary repeated at each
// of the three places submitAttempt() needs to dispatch on it, same table-keyed-by-type
// convention as CONTENT_SCHEMAS_BY_TYPE (question.validator.js).
const CONTEXT_HANDLERS = {
  screen: {
    findById: (id) => screenRepository.findById(id),
    isAttached: (contextId, questionId) =>
      screenQuestionRepository.isAttached(contextId, questionId),
    resolveCourseId: (id) => courseRepository.resolveFromScreenId(id),
    notFoundMessage: "Screen not found.",
  },
  practice_set: {
    findById: (id) => practiceSetRepository.findById(id),
    isAttached: (contextId, questionId) =>
      practiceSetQuestionRepository.isAttached(contextId, questionId),
    resolveCourseId: (id) => courseRepository.resolveFromPracticeSetId(id),
    notFoundMessage: "Practice set not found.",
  },
};

// Pure function, unit-tested directly (02-api-contract.md §5.3 step 7 / "Why this rule exists").
// Kept standalone rather than inlined so the XP-award rule is independently testable across all
// 4 boolean combinations without needing a database.
export function shouldAwardXp({ isCorrect, hasPriorCorrectAttempt }) {
  return isCorrect && !hasPriorCorrectAttempt;
}

function gradeAnswer(type, content, answer) {
  switch (type) {
    case "mcq":
      return answer.selectedOptionIndex === content.correctOptionIndex;
    case "drag_drop":
      return (
        answer.order.length === content.correctOrder.length &&
        answer.order.every((value, index) => value === content.correctOrder[index])
      );
    case "numeric":
      return Math.abs(answer.value - content.correctValue) <= (content.tolerance ?? 0);
    default:
      return false;
  }
}

// Frontend Milestone 6's opt-in "See answer" action needs this shaped exactly like the `answer`
// object each widget already submits (selectedOptionIndex/order/value) -- same field names, so a
// widget can compare its own submitted state against this without a bespoke second shape to learn.
// Only ever called when isCorrect is false (see submitAttempt below); question.service.js's
// stripAnswerFields still governs question.content itself, so this is the one deliberate,
// narrowly-scoped exception -- confirmed with the product owner -- to "learners never receive the
// answer," made only after their own attempt has already been graded incorrect.
function correctAnswerFor(type, content) {
  switch (type) {
    case "mcq":
      return { selectedOptionIndex: content.correctOptionIndex };
    case "drag_drop":
      return { order: content.correctOrder };
    case "numeric":
      return { value: content.correctValue };
    default:
      return null;
  }
}

// 02-api-contract.md §5.3 -- server-side steps, strictly in order. The EXISTS check (step 5) must
// run before the insert (step 6), or it would always see the row currently being inserted and
// never detect "no prior correct attempt" correctly.
async function submitAttempt(userId, { questionId, contextType, contextId, answer }) {
  const question = await questionRepository.findById(questionId); // step 1
  if (!question) throw new NotFoundError("Question not found.");

  const validatedAnswer = validateAnswer(question.type, answer);
  const handler = CONTEXT_HANDLERS[contextType];

  const context = await handler.findById(contextId); // step 2
  if (!context) throw new NotFoundError(handler.notFoundMessage);

  const isAttached = await handler.isAttached(contextId, questionId); // step 3
  if (!isAttached) throw new ContextMismatchError();

  const isCorrect = gradeAnswer(question.type, question.content, validatedAnswer); // step 4

  const hasPriorCorrectAttempt = await attemptRepository.hasCorrectAttempt(userId, questionId); // step 5

  const attempt = await attemptRepository.create({
    userId,
    questionId,
    contextType,
    contextId,
    answer: validatedAnswer,
    isCorrect,
  }); // step 6

  const xpAwarded = shouldAwardXp({ isCorrect, hasPriorCorrectAttempt });
  if (xpAwarded) {
    // The course a question was attempted *in* is resolved from the context (Screen/PracticeSet),
    // not the Question itself -- a Question can be attached to multiple courses (Variant D's own
    // reasoning), so only the context actually used here identifies which course's Progress to
    // credit.
    const courseId = await handler.resolveCourseId(contextId);
    await progressRepository.awardXp(userId, courseId, XP_PER_CORRECT_ANSWER); // step 7
  }

  return {
    id: attempt.id,
    questionId: attempt.question_id,
    isCorrect: attempt.is_correct,
    xpAwarded,
    attemptedAt: attempt.attempted_at,
    ...(isCorrect ? {} : { correctAnswer: correctAnswerFor(question.type, question.content) }),
    // Unlike correctAnswer, explanation rides along on BOTH outcomes -- "why" is worth reading
    // whether the learner got it right or just got lucky/reasoned it out differently. This is the
    // one place a learner ever receives it (question.service.js's toPublicQuestion excludes it
    // from every pre-attempt response), since by now the attempt is already graded.
    explanation: question.explanation ?? null,
  };
}

async function getForUser(targetUserId, courseId) {
  if (courseId) return attemptRepository.findAllForUserAndCourse(targetUserId, courseId);
  return attemptRepository.findAllForUser(targetUserId);
}

export const attemptService = { submitAttempt, getForUser, shouldAwardXp };
