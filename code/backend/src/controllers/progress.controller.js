import { asyncHandler } from "../utils/asyncHandler.js";
import { progressService } from "../services/progress.service.js";

// req.targetUserId is resolved/validated by requireStudentOwnership (ownership.middleware.js)
// before this controller ever runs.
export const listProgressController = asyncHandler(async (req, res) => {
  const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
  const progress = await progressService.getForUser(req.targetUserId, courseId);
  res.status(200).json({
    progress,
    pagination: { page: 1, limit: progress.length, total: progress.length },
  });
});
