import { z } from "zod";

// role is never editable through this endpoint (02-api-contract.md §2.8) -- not included here at
// all, so there's no field to strip; email isn't part of the documented update surface either.
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});
