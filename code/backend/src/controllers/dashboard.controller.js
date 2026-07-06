import { asyncHandler } from "../utils/asyncHandler.js";
import { dashboardService } from "../services/dashboard.service.js";

export const getCompletionController = asyncHandler(async (req, res) => {
  const courses = await dashboardService.getCompletionStats(Number(req.params.cohortId));
  res.status(200).json({
    courses,
    pagination: { page: 1, limit: courses.length, total: courses.length },
  });
});

export const getLessonPacingController = asyncHandler(async (req, res) => {
  const lessons = await dashboardService.getLessonPacing(Number(req.params.cohortId));
  res.status(200).json({
    lessons,
    pagination: { page: 1, limit: lessons.length, total: lessons.length },
  });
});
