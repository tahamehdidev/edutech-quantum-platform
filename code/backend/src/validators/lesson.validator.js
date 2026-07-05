import { z } from "zod";

export const CreateLessonSchema = z.object({
  title: z.string().min(1).max(200),
});

export const UpdateLessonSchema = CreateLessonSchema.partial();
