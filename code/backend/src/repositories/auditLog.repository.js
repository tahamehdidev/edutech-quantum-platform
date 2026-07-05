import { pool } from "../config/db.js";

// create() only for now (Milestone 1) -- scripts/create-admin.js needs it immediately. The read
// side (GET /audit-log) and its controller/service are built in Milestone 6.
async function create({ userId, action, resourceType, resourceId, metadata = null }) {
  const result = await pool.query(
    `INSERT INTO audit_log (user_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, action, resourceType, resourceId, metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
}

export const auditLogRepository = { create };
