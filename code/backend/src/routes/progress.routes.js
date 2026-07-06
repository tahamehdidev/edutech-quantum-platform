import { Router } from "express";
import { requireStudentOwnership } from "../middleware/ownership.middleware.js";
import { studentDataLimiter } from "../middleware/rateLimit.middleware.js";
import { listProgressController } from "../controllers/progress.controller.js";

const router = Router();

// No write route at all, deliberately (02-api-contract.md §5.1) -- xp/current_streak/level only
// ever change as a side effect of POST /attempts.
router.get("/", studentDataLimiter, requireStudentOwnership, listProgressController);

export default router;
