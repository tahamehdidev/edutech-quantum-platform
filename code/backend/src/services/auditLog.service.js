import { auditLogRepository } from "../repositories/auditLog.repository.js";

// Thin by design (04-application-architecture.md §1.1) -- validates nothing, since it's always
// called from trusted internal code, never a request body. One named entry point so every
// audit-write call site looks the same, rather than each service constructing the insert itself.
async function record({ userId, action, resourceType, resourceId, metadata }) {
  return auditLogRepository.create({ userId, action, resourceType, resourceId, metadata });
}

export const auditLogService = { record };
