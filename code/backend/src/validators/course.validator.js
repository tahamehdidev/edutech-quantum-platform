import { z } from "zod";

export const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  narrative: z.string().optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();
