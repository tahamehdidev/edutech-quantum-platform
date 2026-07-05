import { z } from "zod";

// Shared by every reorder endpoint (chapters, lessons, screens now; practice-set questions in
// Milestone 3) -- the request shape is identical in all four cases (02-api-contract.md §3.4):
// the client sends the full ordered sibling-id list, the server validates an exact-set match.
export const ReorderIdsSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});
