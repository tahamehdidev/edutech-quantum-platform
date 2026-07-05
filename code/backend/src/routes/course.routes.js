import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCourseOwnership } from "../middleware/ownership.middleware.js";
import { CreateCourseSchema, UpdateCourseSchema } from "../validators/course.validator.js";
import { CreateChapterSchema } from "../validators/chapter.validator.js";
import { ReorderIdsSchema } from "../validators/common.validator.js";
import {
  listCoursesController,
  getCourseController,
  createCourseController,
  updateCourseController,
  deleteCourseController,
} from "../controllers/course.controller.js";
import {
  listChaptersController,
  createChapterController,
  reorderChaptersController,
} from "../controllers/chapter.controller.js";

const router = Router();

// Read access is open to any logged-in user (02-api-contract.md §3.1).
router.get("/", listCoursesController);
router.get("/:courseId", validateIntParam("courseId"), getCourseController);

router.post(
  "/",
  requireRole("admin", "instructor"),
  validateBody(CreateCourseSchema),
  createCourseController
);
router.patch(
  "/:courseId",
  validateIntParam("courseId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(UpdateCourseSchema),
  updateCourseController
);
router.delete(
  "/:courseId",
  validateIntParam("courseId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  deleteCourseController
);

router.get("/:courseId/chapters", validateIntParam("courseId"), listChaptersController);
router.post(
  "/:courseId/chapters",
  validateIntParam("courseId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(CreateChapterSchema),
  createChapterController
);
router.patch(
  "/:courseId/chapters/reorder",
  validateIntParam("courseId"),
  requireRole("admin", "instructor"),
  requireCourseOwnership,
  validateBody(ReorderIdsSchema),
  reorderChaptersController
);

export default router;
