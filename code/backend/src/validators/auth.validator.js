import { z } from "zod";

// No role field -- 02-api-contract.md §2.1: self-signup always creates a learner. If a caller
// sends one anyway, Zod's default (non-strict) parsing simply ignores unknown keys rather than
// rejecting the request, consistent with "ignored, not validated or rejected" from the same section.
export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
