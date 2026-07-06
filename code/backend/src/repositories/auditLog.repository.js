import { pool } from "../config/db.js";

async function create({ userId, action, resourceType, resourceId, metadata = null }) {
  const result = await pool.query(
    `INSERT INTO audit_log (user_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, action, resourceType, resourceId, metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
}

// GET /audit-log (02-api-contract.md §8.3) -- filterable, combinable, all filters optional. Same
// conditions/params-array pattern as question.repository.js's findAll(), the established shape
// for filtered+paginated queries in this codebase.
async function findAll({ resourceType, userId, since, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  if (resourceType) {
    params.push(resourceType);
    conditions.push(`resource_type = $${params.length}`);
  }
  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }
  if (since) {
    params.push(since);
    conditions.push(`created_at >= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rowsParams = [...params, limit, (page - 1) * limit];
  const result = await pool.query(
    `SELECT * FROM audit_log ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    rowsParams
  );
  const countResult = await pool.query(`SELECT COUNT(*) FROM audit_log ${whereClause}`, params);

  return { entries: result.rows, total: Number(countResult.rows[0].count) };
}

export const auditLogRepository = { create, findAll };
