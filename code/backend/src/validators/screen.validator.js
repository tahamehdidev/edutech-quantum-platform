import { z } from "zod";
import { ValidationError } from "../errors/index.js";

// 03-security-architecture.md §5.3. SimulationContentSchema is a deliberate placeholder, not an
// oversight -- widgetType/params here confirm params is genuinely an object without yet
// constraining its per-widget internals, per the same section's own reasoning. Widget types match
// seed_README.md's documented set.
const ExplanationContentSchema = z.object({ text: z.string().min(1) });
const QuestionContentSchema = z.object({}).passthrough(); // actual content lives on the Question row
const SimulationContentSchema = z.object({
  widgetType: z.enum([
    "bloch_sphere",
    "amplitude_bar_chart",
    "topology_diagram",
    "quadrant_selector",
    "basis_encoder",
  ]),
  params: z.record(z.unknown()),
});

const CONTENT_SCHEMAS_BY_TYPE = {
  explanation: ExplanationContentSchema,
  question: QuestionContentSchema,
  simulation: SimulationContentSchema,
};

// Runs in the controller, not as generic validateBody middleware -- the correct schema depends on
// the sibling `type` field, which a single declarative schema can't branch on
// (03-security-architecture.md §5.3).
export function validateScreenContent(type, content) {
  const schema = CONTENT_SCHEMAS_BY_TYPE[type];
  if (!schema) throw new ValidationError(`Unknown screen type: ${type}`, "type");

  const result = schema.safeParse(content);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new ValidationError(firstIssue.message, `content.${firstIssue.path.join(".")}`);
  }
  return result.data;
}

export const CreateScreenSchema = z.object({
  type: z.enum(["explanation", "question", "simulation"]),
  content: z.unknown(),
});

export const UpdateScreenSchema = CreateScreenSchema.partial();
