import { screenQuestionRepository } from "../repositories/screenQuestion.repository.js";
import { screenRepository } from "../repositories/screen.repository.js";
import { questionRepository } from "../repositories/question.repository.js";
import { NotFoundError, DuplicateResourceError } from "../errors/index.js";

async function attach(screenId, questionId) {
  const screen = await screenRepository.findById(screenId);
  if (!screen) throw new NotFoundError("Screen not found.");
  const question = await questionRepository.findById(questionId);
  if (!question) throw new NotFoundError("Question not found.");

  const attached = await screenQuestionRepository.attach(screenId, questionId);
  if (!attached) {
    throw new DuplicateResourceError("This question is already attached to this screen.");
  }
  return attached;
}

async function detach(screenId, questionId) {
  const detached = await screenQuestionRepository.detach(screenId, questionId);
  if (!detached) throw new NotFoundError("This question is not attached to this screen.");
}

export const screenQuestionService = { attach, detach };
