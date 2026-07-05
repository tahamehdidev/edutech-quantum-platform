import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCourseOwnership } from "../middleware/ownership.middleware.js";
import { UpdateScreenSchema } from "../validators/screen.validator.js";
import {
  updateScreenController,
  deleteScreenController,
} from "../controllers/screen.controller.js";

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

export default router;
