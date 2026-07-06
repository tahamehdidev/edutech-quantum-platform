import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireQuestionEditAccess } from "../middleware/ownership.middleware.js";
import { questionSearchLimiter } from "../middleware/rateLimit.middleware.js";
import { CreateQuestionSchema, UpdateQuestionSchema } from "../validators/question.validator.js";
import {
  listQuestionsController,
  getQuestionController,
  createQuestionController,
  updateQuestionController,
  deleteQuestionController,
} from "../controllers/question.controller.js";

const router = Router();

// Read access is open to any logged-in user (02-api-contract.md §4.2) -- makes M:N reuse
// discoverable during authoring.
router.get("/", questionSearchLimiter, listQuestionsController);
router.get("/:questionId", validateIntParam("questionId"), getQuestionController);

router.post(
  "/",
  requireRole("admin", "instructor"),
  validateBody(CreateQuestionSchema),
  createQuestionController
);

// Edit/delete requires edit access (Variant D: creator OR attached-to-an-owned-course), not
// simple ownership -- 03-security-architecture.md §3.4, §4.5.
router.patch(
  "/:questionId",
  validateIntParam("questionId"),
  requireRole("admin", "instructor"),
  requireQuestionEditAccess,
  validateBody(UpdateQuestionSchema),
  updateQuestionController
);
router.delete(
  "/:questionId",
  validateIntParam("questionId"),
  requireRole("admin", "instructor"),
  requireQuestionEditAccess,
  deleteQuestionController
);

export default router;
