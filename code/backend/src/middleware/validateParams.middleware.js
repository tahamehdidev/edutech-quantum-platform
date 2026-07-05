// 03-security-architecture.md §3.4 -- ID format validation runs before any ownership query, so a
// malformed ID is rejected with a clean 400 rather than reaching the database, where it could
// either crash the query or, worse, silently match zero rows and produce a 404 indistinguishable
// from "this resource genuinely doesn't exist."
function invalidFormat(res, paramName) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: `Invalid ${paramName} format.`, field: paramName },
  });
}

// Course/Chapter/Lesson/Screen/Question/PracticeSet all use integer PKs (01-data-model.md).
export function validateIntParam(paramName) {
  return (req, res, next) => {
    if (!/^\d+$/.test(req.params[paramName] ?? "")) {
      return invalidFormat(res, paramName);
    }
    next();
  };
}

// User is the only UUID-keyed resource reachable via a route param so far.
export function validateUuidParam(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName] ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return invalidFormat(res, paramName);
    }
    next();
  };
}
