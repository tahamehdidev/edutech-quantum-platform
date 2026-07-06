import { asyncHandler } from "../utils/asyncHandler.js";
import { attemptService } from "../services/attempt.service.js";

export const submitAttemptController = asyncHandler(async (req, res) => {
  const attempt = await attemptService.submitAttempt(req.user.id, req.validatedBody);
  res.status(201).json({ attempt });
});

// req.targetUserId/req.query.courseId are resolved/validated by requireStudentOwnership
// (ownership.middleware.js) before this controller ever runs.
export const listAttemptsController = asyncHandler(async (req, res) => {
  const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
  const attempts = await attemptService.getForUser(req.targetUserId, courseId);
  res.status(200).json({
    attempts,
    pagination: { page: 1, limit: attempts.length, total: attempts.length },
  });
});
