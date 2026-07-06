import { practiceSetQuestionRepository } from "../repositories/practiceSetQuestion.repository.js";
import { practiceSetRepository } from "../repositories/practiceSet.repository.js";
import { questionRepository } from "../repositories/question.repository.js";
import { isExactSetMatch } from "../utils/exactSetMatch.js";
import { NotFoundError, DuplicateResourceError, ReorderSetMismatchError } from "../errors/index.js";

async function attach(practiceSetId, questionId) {
  const practiceSet = await practiceSetRepository.findById(practiceSetId);
  if (!practiceSet) throw new NotFoundError("Practice set not found.");
  const question = await questionRepository.findById(questionId);
  if (!question) throw new NotFoundError("Question not found.");

  const attached = await practiceSetQuestionRepository.attach(practiceSetId, questionId);
  if (!attached) {
    throw new DuplicateResourceError("This question is already attached to this practice set.");
  }
  return attached;
}

async function detach(practiceSetId, questionId) {
  const detached = await practiceSetQuestionRepository.detach(practiceSetId, questionId);
  if (!detached) throw new NotFoundError("This question is not attached to this practice set.");
}

async function reorder(practiceSetId, orderedQuestionIds) {
  const actualIds = await practiceSetQuestionRepository.findSiblingQuestionIds(practiceSetId);
  if (!isExactSetMatch(actualIds, orderedQuestionIds)) {
    throw new ReorderSetMismatchError();
  }
  await practiceSetQuestionRepository.applyOrder(practiceSetId, orderedQuestionIds);
}

export const practiceSetQuestionService = { attach, detach, reorder };
