import { z } from "zod";

export const CreateChapterSchema = z.object({
  title: z.string().min(1).max(200),
});

export const UpdateChapterSchema = CreateChapterSchema.partial();
