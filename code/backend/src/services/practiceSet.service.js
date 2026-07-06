import { practiceSetRepository } from "../repositories/practiceSet.repository.js";
import { practiceSetQuestionRepository } from "../repositories/practiceSetQuestion.repository.js";
import { questionService } from "./question.service.js";
import { NotFoundError } from "../errors/index.js";

async function listForLesson(lessonId) {
  return practiceSetRepository.findAllForLesson(lessonId);
}

// "Get one (with ordered questions)" (02-api-contract.md §4.2) -- Question.content shaped per
// caller role the same way question.service.js shapes it standalone, via the shared
// toPublicQuestion() rather than a second implementation of the answer-stripping rule.
async function getById(id, callerRole) {
  const practiceSet = await practiceSetRepository.findById(id);
  if (!practiceSet) throw new NotFoundError("Practice set not found.");
  const questions = await practiceSetQuestionRepository.findQuestionsForPracticeSet(id);
  return {
    ...practiceSet,
    questions: questions.map((q) => questionService.toPublicQuestion(q, callerRole)),
  };
}

async function create(lessonId, { title }) {
  return practiceSetRepository.create({ lessonId, title });
}

async function update(id, { title }) {
  const practiceSet = await practiceSetRepository.update(id, { title });
  if (!practiceSet) throw new NotFoundError("Practice set not found.");
  return practiceSet;
}

async function remove(id) {
  const practiceSet = await practiceSetRepository.findById(id);
  if (!practiceSet) throw new NotFoundError("Practice set not found.");
  await practiceSetRepository.deleteById(id);
}

export const practiceSetService = { listForLesson, getById, create, update, remove };
