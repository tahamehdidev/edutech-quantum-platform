import { progressRepository } from "../repositories/progress.repository.js";

// courseId omitted -> all of the target user's Progress rows (their own dashboard view, or an
// admin browsing a user with no course filter). courseId given -> just that one course's row, or
// an empty list if the user has no Progress there yet (02-api-contract.md §5.2).
async function getForUser(targetUserId, courseId) {
  if (courseId) {
    const progress = await progressRepository.findByUserAndCourse(targetUserId, courseId);
    return progress ? [progress] : [];
  }
  return progressRepository.findAllForUser(targetUserId);
}

export const progressService = { getForUser };
