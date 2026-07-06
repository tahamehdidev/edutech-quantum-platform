import { Router } from "express";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { validateIntParam, validateUuidParam } from "../middleware/validateParams.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireCohortOwnership } from "../middleware/ownership.middleware.js";
import {
  cohortEnrollLimiter,
  cohortAdminReassignLimiter,
} from "../middleware/rateLimit.middleware.js";
import { CreateCohortSchema, UpdateCohortSchema } from "../validators/cohort.validator.js";
import { EnrollStudentSchema } from "../validators/cohortEnrollment.validator.js";
import {
  getCohortController,
  listCohortsController,
  createCohortController,
  updateCohortController,
  deleteCohortController,
} from "../controllers/cohort.controller.js";
import {
  listStudentsController,
  enrollStudentController,
  removeStudentController,
} from "../controllers/cohortEnrollment.controller.js";

const router = Router();

// Instructor-only, self-listing (02-api-contract.md §6.2) -- no admin variant documented for
// this route, unlike every other route below.
router.get("/", requireRole("instructor"), listCohortsController);

router.get(
  "/:cohortId",
  validateIntParam("cohortId"),
  requireRole("instructor", "admin"),
  requireCohortOwnership,
  getCohortController
);

// Rate limiter runs first among route-specific middleware (03-security-architecture.md §3.5).
// cohortAdminReassignLimiter no-ops unless this specific request is an admin reassigning
// ownership via instructorId -- ordinary creates are unthrottled, same as Groups 2-3.
router.post(
  "/",
  requireRole("instructor", "admin"),
  cohortAdminReassignLimiter,
  validateBody(CreateCohortSchema),
  createCohortController
);

router.patch(
  "/:cohortId",
  validateIntParam("cohortId"),
  requireRole("instructor", "admin"),
  requireCohortOwnership,
  validateBody(UpdateCohortSchema),
  updateCohortController
);

router.delete(
  "/:cohortId",
  validateIntParam("cohortId"),
  requireRole("instructor", "admin"),
  requireCohortOwnership,
  deleteCohortController
);

router.get(
  "/:cohortId/students",
  validateIntParam("cohortId"),
  requireRole("instructor", "admin"),
  requireCohortOwnership,
  listStudentsController
);

router.post(
  "/:cohortId/students",
  validateIntParam("cohortId"),
  requireRole("instructor", "admin"),
  requireCohortOwnership,
  cohortEnrollLimiter,
  validateBody(EnrollStudentSchema),
  enrollStudentController
);

router.patch(
  "/:cohortId/students/:userId",
  validateIntParam("cohortId"),
  validateUuidParam("userId"),
  requireRole("instructor", "admin"),
  requireCohortOwnership,
  removeStudentController
);

export default router;
