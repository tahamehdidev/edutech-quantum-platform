// 03-security-architecture.md §5.1 -- one mechanism for every endpoint, simple fields included,
// rather than reserving Zod for only the complex JSONB cases. Controllers read req.validatedBody,
// never raw req.body.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue.message,
          field: firstIssue.path.join("."),
        },
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
