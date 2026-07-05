import { courseService } from "../services/course.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 03-security-architecture.md §3.4 Variant C. Admins bypass every ownership check by design
// (§3.6) -- ownership questions are architecturally meaningless for a platform-wide role.
// Goes through course.service.js, never course.repository.js directly -- middleware gets no
// exception to the controller->service->repository layering rule (04-application-architecture.md
// §1).
export const requireCourseOwnership = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const courseId = await courseService.resolveCourseId(req.params);
  req.course = await courseService.checkOwnership(req.user.id, courseId);
  next();
});
