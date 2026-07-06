import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { requireStudentOwnership } from "../middleware/ownership.middleware.js";
import { attemptSubmitLimiter, studentDataLimiter } from "../middleware/rateLimit.middleware.js";
import { SubmitAttemptSchema } from "../validators/attempt.validator.js";
import {
  submitAttemptController,
  listAttemptsController,
} from "../controllers/attempt.controller.js";

const router = Router();

// Open to any logged-in role (02-api-contract.md §5.2) -- userId is always server-derived,
// never accepted from the body (§5.3).
router.post("/", attemptSubmitLimiter, validateBody(SubmitAttemptSchema), submitAttemptController);

// Single route shape serves both "my own history" (userId=me, any role) and "another user's
// history" (userId=:id, instructor/admin only, ownership-checked) -- requireStudentOwnership
// resolves which case this is (§5.2).
router.get("/", studentDataLimiter, requireStudentOwnership, listAttemptsController);

export default router;
