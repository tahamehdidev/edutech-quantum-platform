import { z } from "zod";

export const EnrollStudentSchema = z.object({
  userId: z.string().uuid(),
});
