import { courseService } from "../services/course.service.js";
import { questionService } from "../services/question.service.js";
import { cohortEnrollmentService } from "../services/cohortEnrollment.service.js";
import { ForbiddenError, ValidationError } from "../errors/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// 03-security-architecture.md §3.4 Variant B, composed for GET /attempts and GET /progress's
// single shared route shape (02-api-contract.md §5.2): `userId=me` must stay reachable by every
// role for a caller's own data, so this can't be a plain requireRole(...) gate run before it --
// self-access has to be resolved first, before any role/ownership question is even asked.
// Resolved target id is cached on req.targetUserId so the controller doesn't need to re-resolve
// "me" itself.
export const requireStudentOwnership = asyncHandler(async (req, res, next) => {
  const rawUserId = req.query.userId;
  if (!rawUserId) {
    throw new ValidationError("userId is required.", "userId");
  }

  // "me" was already substituted for req.user.id above, so targetUserId can only be req.user.id
  // (always a valid UUID) or whatever the client sent verbatim -- only the latter needs checking.
  const targetUserId = rawUserId === "me" ? req.user.id : rawUserId;
  if (targetUserId !== req.user.id && !UUID_RE.test(targetUserId)) {
    throw new ValidationError("Invalid userId format.", "userId");
  }
  req.targetUserId = targetUserId;

  if (targetUserId === req.user.id) return next(); // always allowed to see your own data
  if (req.user.role === "admin") return next(); // admins bypass every ownership check

  if (req.user.role !== "instructor") {
    throw new ForbiddenError("You do not have access to this student's data.");
  }

  // Threat-model gap #3 (02-api-contract.md §5.2): courseId is required, not optional, for an
  // instructor viewing another user's data -- built this way from the start rather than as a
  // later fix.
  const courseId = req.query.courseId;
  if (!courseId || !/^\d+$/.test(courseId)) {
    throw new ValidationError("courseId is required when viewing another user's data.", "courseId");
  }

  const hasAccess = await cohortEnrollmentService.checkStudentOwnership(
    req.user.id,
    targetUserId,
    Number(courseId)
  );
  if (!hasAccess) {
    throw new ForbiddenError("You do not have access to this student's data.");
  }
  next();
});
