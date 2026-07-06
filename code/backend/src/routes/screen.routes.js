import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCourseOwnership } from "../middleware/ownership.middleware.js";
import { UpdateScreenSchema } from "../validators/screen.validator.js";
import { AttachQuestionSchema } from "../validators/question.validator.js";
import {
  updateScreenController,
  deleteScreenController,
} from "../controllers/screen.controller.js";
import {
  attachQuestionToScreenController,
  detachQuestionFromScreenController,
} from "../controllers/screenQuestion.controller.js";

const router = Router();

router.patch(
  "/:screenId",
  validateIntParam("screenId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(UpdateScreenSchema),
  updateScreenController
);

// Leaf node -- no ?confirm=true (02-api-contract.md §3.5).
router.delete(
  "/:screenId",
  validateIntParam("screenId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  deleteScreenController
);

router.post(
  "/:screenId/questions",
  validateIntParam("screenId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(AttachQuestionSchema),
  attachQuestionToScreenController
);
router.delete(
  "/:screenId/questions/:questionId",
  validateIntParam("screenId"),
  validateIntParam("questionId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  detachQuestionFromScreenController
);

export default router;
