// 04-application-architecture.md §6.5 -- Express doesn't catch errors thrown inside async route
// handlers/middleware on its own; wrapping every one of them is the only way to make "throw" the
// single, consistent way to signal a problem, rather than a discipline that has to be
// remembered and reapplied every time a new controller or middleware function is added.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
