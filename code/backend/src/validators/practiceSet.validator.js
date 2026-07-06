import { z } from "zod";

export const CreatePracticeSetSchema = z.object({
  title: z.string().min(1).max(200),
});

export const UpdatePracticeSetSchema = CreatePracticeSetSchema.partial();
