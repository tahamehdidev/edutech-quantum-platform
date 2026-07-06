import { asyncHandler } from "../utils/asyncHandler.js";
import { auditLogService } from "../services/auditLog.service.js";

export const listAuditLogController = asyncHandler(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await auditLogService.list({
    resourceType: req.query.resourceType,
    userId: req.query.userId,
    since: req.query.since,
    page,
    limit,
  });
  res.status(200).json(result);
});
