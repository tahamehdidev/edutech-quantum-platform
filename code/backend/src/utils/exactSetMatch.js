// Shared by every reorder endpoint (chapters, lessons, screens now; practice-set questions in
// Milestone 3) -- 02-api-contract.md §3.1: the submitted ID set must exactly match the actual
// current siblings (same size, same IDs, no extras, no omissions, no duplicates) before anything
// is applied. Extracted as a pure function so it's cheaply unit-testable without a DB, the same
// way shouldAwardXp() will be in Milestone 4.
export function isExactSetMatch(actualIds, submittedIds) {
  const actualSet = new Set(actualIds);
  const submittedSet = new Set(submittedIds);

  if (actualSet.size !== submittedSet.size) return false;
  // A duplicate in submittedIds (e.g. [1, 1, 2] instead of [1, 2, 3]) would otherwise pass a
  // naive "every submitted id is in the actual set" check -- this catches it.
  if (submittedSet.size !== submittedIds.length) return false;

  for (const id of submittedSet) {
    if (!actualSet.has(id)) return false;
  }
  return true;
}
