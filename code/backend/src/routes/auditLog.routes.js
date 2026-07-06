import { Router } from "express";
import { requireRole } from "../middleware/role.middleware.js";
import { listAuditLogController } from "../controllers/auditLog.controller.js";

const router = Router();

// Read-only, admin-only, no write access via the API at all (02-api-contract.md §8.1) -- entries
// are created exclusively as a side effect of the specific actions 01-data-model.md's AuditLog
// spec names, never directly.
router.get("/", requireRole("admin"), listAuditLogController);

export default router;
