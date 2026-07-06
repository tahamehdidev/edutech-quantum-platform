import { courseService } from "../services/course.service.js";
import { questionService } from "../services/question.service.js";
import { ForbiddenError } from "../errors/index.js";
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

// 03-security-architecture.md §3.4 Variant D. Structurally different from Variant C: a Question
// can't inherit ownership from a single parent, since the same question can be attached to
// multiple courses owned by different instructors at once. Edit access is creator-OR-attached-
// to-an-owned-course instead of simple ownership.
export const requireQuestionEditAccess = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const hasAccess = await questionService.checkEditAccess(
    req.user.id,
    Number(req.params.questionId)
  );
  if (!hasAccess) {
    throw new ForbiddenError("You do not have edit access to this question.");
  }
  next();
});
