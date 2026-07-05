import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCourseOwnership } from "../middleware/ownership.middleware.js";
import { UpdateChapterSchema } from "../validators/chapter.validator.js";
import { CreateLessonSchema } from "../validators/lesson.validator.js";
import { ReorderIdsSchema } from "../validators/common.validator.js";
import {
  updateChapterController,
  deleteChapterController,
} from "../controllers/chapter.controller.js";
import {
  listLessonsController,
  createLessonController,
  reorderLessonsController,
} from "../controllers/lesson.controller.js";

const router = Router();

router.patch(
  "/:chapterId",
  validateIntParam("chapterId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(UpdateChapterSchema),
  updateChapterController
);
router.delete(
  "/:chapterId",
  validateIntParam("chapterId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  deleteChapterController
);

router.get("/:chapterId/lessons", validateIntParam("chapterId"), listLessonsController);
router.post(
  "/:chapterId/lessons",
  validateIntParam("chapterId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(CreateLessonSchema),
  createLessonController
);
router.patch(
  "/:chapterId/lessons/reorder",
  validateIntParam("chapterId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(ReorderIdsSchema),
  reorderLessonsController
);

export default router;
