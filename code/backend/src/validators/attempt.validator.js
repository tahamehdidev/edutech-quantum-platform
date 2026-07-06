import { z } from "zod";
import { ValidationError } from "../errors/index.js";

// 02-api-contract.md §5.3's request example shows `{"selectedOption": "B"}` (a letter), but no
// letter labels exist anywhere in Question.content -- options is a plain string array and
// McqContentSchema (question.validator.js) already grades against a numeric correctOptionIndex.
// Answers are validated against that same numeric shape instead of introducing an unspecified
// letter-to-index mapping.
const McqAnswerSchema = z.object({ selectedOptionIndex: z.number().int().min(0) });
const DragDropAnswerSchema = z.object({ order: z.array(z.number().int()) });
const NumericAnswerSchema = z.object({ value: z.number() });

const ANSWER_SCHEMAS_BY_TYPE = {
  mcq: McqAnswerSchema,
  drag_drop: DragDropAnswerSchema,
  numeric: NumericAnswerSchema,
};

// Runs inside attempt.service.js's submitAttempt(), not the controller -- unlike Screen/Question
// content, the question's type isn't known until the service fetches the question itself
// (02-api-contract.md §5.3 step 1 must happen first).
export function validateAnswer(type, answer) {
  const schema = ANSWER_SCHEMAS_BY_TYPE[type];
  const result = schema.safeParse(answer);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new ValidationError(firstIssue.message, `answer.${firstIssue.path.join(".")}`);
  }
  return result.data;
}

export const SubmitAttemptSchema = z.object({
  questionId: z.number().int(),
  contextType: z.enum(["screen", "practice_set"]),
  contextId: z.number().int(),
  answer: z.unknown(),
});
