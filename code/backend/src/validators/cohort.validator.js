import { z } from "zod";

// instructorId is optional and admin-only in practice (02-api-contract.md §6.1) -- an instructor
// caller's own instructorId, if sent, is silently ignored at the service layer, not rejected here.
export const CreateCohortSchema = z.object({
  name: z.string().min(1),
  instructorId: z.string().uuid().optional(),
});

export const UpdateCohortSchema = CreateCohortSchema.partial();
