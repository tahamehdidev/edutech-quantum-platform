import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCourseOwnership } from "../middleware/ownership.middleware.js";
import { UpdateLessonSchema } from "../validators/lesson.validator.js";
import { CreateScreenSchema } from "../validators/screen.validator.js";
import { ReorderIdsSchema } from "../validators/common.validator.js";
import {
  updateLessonController,
  deleteLessonController,
} from "../controllers/lesson.controller.js";
import {
  listScreensController,
  createScreenController,
  reorderScreensController,
} from "../controllers/screen.controller.js";

const router = Router();

router.patch(
  "/:lessonId",
  validateIntParam("lessonId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(UpdateLessonSchema),
  updateLessonController
);
router.delete(
  "/:lessonId",
  validateIntParam("lessonId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  deleteLessonController
);

router.get("/:lessonId/screens", validateIntParam("lessonId"), listScreensController);
router.post(
  "/:lessonId/screens",
  validateIntParam("lessonId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(CreateScreenSchema),
  createScreenController
);
router.patch(
  "/:lessonId/screens/reorder",
  validateIntParam("lessonId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(ReorderIdsSchema),
  reorderScreensController
);

export default router;
