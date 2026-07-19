import { z } from "zod";
import { ValidationError } from "../errors/index.js";

// 03-security-architecture.md §5.2. Same type-branching pattern as Screen.content
// (screen.validator.js) -- the correct schema depends on the sibling `type` field.
const McqContentSchema = z.object({
  options: z.array(z.string()).min(2),
  correctOptionIndex: z.number().int().min(0),
});
const DragDropContentSchema = z.object({
  items: z.array(z.string()),
  correctOrder: z.array(z.number().int()),
});
const NumericContentSchema = z.object({
  correctValue: z.number(),
  tolerance: z.number().min(0).optional(),
});

const CONTENT_SCHEMAS_BY_TYPE = {
  mcq: McqContentSchema,
  drag_drop: DragDropContentSchema,
  numeric: NumericContentSchema,
};

// Runs in the controller, same reasoning as validateScreenContent (03-security-architecture.md §5.2).
export function validateQuestionContent(type, content) {
  const schema = CONTENT_SCHEMAS_BY_TYPE[type];
  if (!schema) throw new ValidationError(`Unknown question type: ${type}`, "type");

  const result = schema.safeParse(content);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new ValidationError(firstIssue.message, `content.${firstIssue.path.join(".")}`);
  }
  return result.data;
}

export const CreateQuestionSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(["mcq", "drag_drop", "numeric"]),
  content: z.unknown(),
  // Both optional -- a question can be authored with neither, same as before this feature
  // existed. hint is safe to show pre-attempt; explanation is never returned to a learner
  // caller before their attempt is graded (question.service.js's toPublicQuestion).
  hint: z.string().min(1).optional(),
  explanation: z.string().min(1).optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

export const AttachQuestionSchema = z.object({
  questionId: z.number().int(),
});
