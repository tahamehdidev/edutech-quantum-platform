import { auditLogRepository } from "../repositories/auditLog.repository.js";
import { ValidationError } from "../errors/index.js";

// Thin by design (04-application-architecture.md §1.1) -- validates nothing, since it's always
// called from trusted internal code, never a request body. One named entry point so every
// audit-write call site looks the same, rather than each service constructing the insert itself.
async function record({ userId, action, resourceType, resourceId, metadata }) {
  return auditLogRepository.create({ userId, action, resourceType, resourceId, metadata });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /audit-log (02-api-contract.md §8.3). userId is checked for UUID format here (unlike
// resourceType, a free-text filter with no format to violate) because user_id is a UUID column --
// a malformed value would otherwise reach Postgres as a type-cast error instead of a clean 400.
async function list({ resourceType, userId, since, page, limit }) {
  if (userId && !UUID_RE.test(userId)) {
    throw new ValidationError("Invalid userId format.", "userId");
  }
  const { entries, total } = await auditLogRepository.findAll({
    resourceType,
    userId,
    since,
    page,
    limit,
  });
  return { entries, pagination: { page, limit, total } };
}

export const auditLogService = { record, list };
