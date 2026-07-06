import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCourseOwnership } from "../middleware/ownership.middleware.js";
import { UpdatePracticeSetSchema } from "../validators/practiceSet.validator.js";
import { AttachQuestionSchema } from "../validators/question.validator.js";
import { ReorderIdsSchema } from "../validators/common.validator.js";
import {
  getPracticeSetController,
  updatePracticeSetController,
  deletePracticeSetController,
} from "../controllers/practiceSet.controller.js";
import {
  attachQuestionToPracticeSetController,
  detachQuestionFromPracticeSetController,
  reorderPracticeSetQuestionsController,
} from "../controllers/practiceSetQuestion.controller.js";

const router = Router();

router.get("/:practiceSetId", validateIntParam("practiceSetId"), getPracticeSetController);
router.patch(
  "/:practiceSetId",
  validateIntParam("practiceSetId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(UpdatePracticeSetSchema),
  updatePracticeSetController
);
router.delete(
  "/:practiceSetId",
  validateIntParam("practiceSetId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  deletePracticeSetController
);

router.post(
  "/:practiceSetId/questions",
  validateIntParam("practiceSetId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(AttachQuestionSchema),
  attachQuestionToPracticeSetController
);
router.delete(
  "/:practiceSetId/questions/:questionId",
  validateIntParam("practiceSetId"),
  validateIntParam("questionId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  detachQuestionFromPracticeSetController
);
router.patch(
  "/:practiceSetId/questions/reorder",
  validateIntParam("practiceSetId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(ReorderIdsSchema),
  reorderPracticeSetQuestionsController
);

export default router;
