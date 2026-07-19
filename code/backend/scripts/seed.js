// seeds/seed_README.md -- loads one course's seed JSON via repository functions directly,
// bypassing HTTP entirely (same precedent as create-admin.js). Usage:
//   node scripts/seed.js <path-to-seed-file.json> <instructor-or-admin-email>
import "dotenv/config";
import { readFileSync } from "node:fs";
import { userRepository } from "../src/repositories/user.repository.js";
import { courseRepository } from "../src/repositories/course.repository.js";
import { chapterRepository } from "../src/repositories/chapter.repository.js";
import { lessonRepository } from "../src/repositories/lesson.repository.js";
import { screenRepository } from "../src/repositories/screen.repository.js";
import { questionRepository } from "../src/repositories/question.repository.js";
import { screenQuestionRepository } from "../src/repositories/screenQuestion.repository.js";
import { practiceSetRepository } from "../src/repositories/practiceSet.repository.js";
import { practiceSetQuestionRepository } from "../src/repositories/practiceSetQuestion.repository.js";
import { validateScreenContent } from "../src/validators/screen.validator.js";
import { validateQuestionContent } from "../src/validators/question.validator.js";

const [, , seedFilePathArg, authorEmailArg] = process.argv;

if (!seedFilePathArg || !authorEmailArg) {
  console.error("Usage: node scripts/seed.js <path-to-seed-file.json> <instructor-or-admin-email>");
  process.exit(1);
}

// Fails loudly on any structural/content problem before writing a single row, rather than
// discovering a malformed seed file partway through loading it (seed_README.md's own loading
// instructions). No cross-cutting DB transaction wraps the inserts in loadCourse() below --
// the repository functions called here share the app's own connection pool, not a passed-in
// client, same as create-admin.js -- so this upfront pass is what keeps a real mid-run failure
// to only genuine, rare DB errors rather than routine content mistakes in the seed file itself.
function validateSeedFile(course) {
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      const inlineIds = new Set(lesson.inline_questions.map((q) => q.id));

      for (const screen of lesson.screens) {
        validateScreenContent(screen.type, screen.content);
        if (screen.type === "question" && !inlineIds.has(screen.question_ref)) {
          throw new Error(
            `Lesson "${lesson.title}": screen references question_ref=${screen.question_ref}, ` +
              `but no inline_question with that id exists in this lesson.`
          );
        }
      }

      for (const question of lesson.inline_questions) {
        validateQuestionContent(question.type, question.content);
      }

      for (const practiceSet of lesson.practice_sets) {
        for (const { question } of practiceSet.questions) {
          validateQuestionContent(question.type, question.content);
        }
      }
    }
  }
}

// order_index on Chapter/Lesson/Screen/PracticeSetQuestion is never read from the seed file --
// every repository create() below server-computes it (MAX+1), and the seed file's arrays are
// already sorted by order_index, so inserting in the given array order reproduces the same
// sequence without needing to trust or cross-check the seed's own order_index field.
async function loadLesson(chapterId, lesson, createdById) {
  const realLesson = await lessonRepository.create({ chapterId, title: lesson.title });

  // Screens before Questions before the junction linking them, per seed_README.md's documented
  // load order -- a question-type screen's content is just {} (the real content lives on the
  // Question row), so the screen itself never needs question_ref resolved to be inserted.
  const insertedScreens = [];
  for (const screen of lesson.screens) {
    const realScreen = await screenRepository.create({
      lessonId: realLesson.id,
      type: screen.type,
      content: screen.content,
    });
    insertedScreens.push({ realScreen, seedScreen: screen });
  }

  const questionIdBySeedId = new Map();
  for (const question of lesson.inline_questions) {
    const realQuestion = await questionRepository.create({
      prompt: question.prompt,
      type: question.type,
      content: question.content,
      createdById,
      hint: question.hint,
      explanation: question.explanation,
    });
    questionIdBySeedId.set(question.id, realQuestion.id);
  }

  for (const { realScreen, seedScreen } of insertedScreens) {
    if (seedScreen.type !== "question") continue;
    const attached = await screenQuestionRepository.attach(
      realScreen.id,
      questionIdBySeedId.get(seedScreen.question_ref)
    );
    if (!attached) {
      throw new Error(`Screen ${realScreen.id} was already attached -- unexpected on fresh load.`);
    }
  }

  for (const practiceSet of lesson.practice_sets) {
    const realPracticeSet = await practiceSetRepository.create({
      lessonId: realLesson.id,
      title: practiceSet.title,
    });
    for (const { question } of practiceSet.questions) {
      const realQuestion = await questionRepository.create({
        prompt: question.prompt,
        type: question.type,
        content: question.content,
        createdById,
        hint: question.hint,
        explanation: question.explanation,
      });
      const attached = await practiceSetQuestionRepository.attach(
        realPracticeSet.id,
        realQuestion.id
      );
      if (!attached) {
        throw new Error(
          `Practice set ${realPracticeSet.id} was already attached -- unexpected on fresh load.`
        );
      }
    }
  }

  return {
    screens: insertedScreens.length,
    inlineQuestions: lesson.inline_questions.length,
    practiceSets: lesson.practice_sets.length,
    practiceQuestions: lesson.practice_sets.reduce((sum, ps) => sum + ps.questions.length, 0),
  };
}

async function main() {
  const course = JSON.parse(readFileSync(seedFilePathArg, "utf-8"));

  const author = await userRepository.findByEmail(authorEmailArg);
  if (!author || !["instructor", "admin"].includes(author.role)) {
    throw new Error(`${authorEmailArg} must reference an existing instructor or admin account.`);
  }

  // A flat title check, not a unique DB constraint -- Course.title has none, and adding one
  // solely for this script would be a schema change to solve a problem an application-level
  // check already solves (01-data-model.md documents no such constraint).
  const existingCourses = await courseRepository.findAll();
  if (existingCourses.some((c) => c.title === course.title)) {
    throw new Error(
      `A course titled "${course.title}" already exists -- refusing to load a duplicate. ` +
        `Delete it first (DELETE /courses/:id?confirm=true) if you intend to reload it.`
    );
  }

  validateSeedFile(course);

  const realCourse = await courseRepository.create({
    title: course.title,
    narrative: course.narrative,
    createdById: author.id,
  });

  // validateSeedFile() above only rules out *content* problems before any row exists -- it does
  // not, and cannot, rule out a genuine DB error (dropped connection, exhausted pool, disk full)
  // partway through the loop below. No transaction wraps this loop (the repository functions
  // called here share the app's own pool, not a passed-in client, same as create-admin.js), so if
  // that happens, "fails loudly" does NOT mean "leaves nothing behind": course `realCourse.id`
  // and whatever chapters/lessons/screens/questions were inserted before the failure stay in the
  // database. This catch exists so that fact is surfaced immediately, with the exact cleanup
  // command, rather than the operator discovering it indirectly on a retry via the duplicate-
  // title check above.
  try {
    const totals = {
      chapters: 0,
      lessons: 0,
      screens: 0,
      inlineQuestions: 0,
      practiceSets: 0,
      practiceQuestions: 0,
    };
    for (const chapter of course.chapters) {
      const realChapter = await chapterRepository.create({
        courseId: realCourse.id,
        title: chapter.title,
      });
      totals.chapters++;
      for (const lesson of chapter.lessons) {
        const lessonTotals = await loadLesson(realChapter.id, lesson, author.id);
        totals.lessons++;
        totals.screens += lessonTotals.screens;
        totals.inlineQuestions += lessonTotals.inlineQuestions;
        totals.practiceSets += lessonTotals.practiceSets;
        totals.practiceQuestions += lessonTotals.practiceQuestions;
      }
    }

    console.log(`Loaded "${course.title}" (course id ${realCourse.id}):`);
    console.log(
      `  ${totals.chapters} chapters, ${totals.lessons} lessons, ${totals.screens} screens, ` +
        `${totals.inlineQuestions} inline questions, ${totals.practiceSets} practice sets, ` +
        `${totals.practiceQuestions} practice questions.`
    );
  } catch (err) {
    throw new Error(
      `Loading failed partway through: ${err.message}\n` +
        `Course id ${realCourse.id} ("${course.title}") likely has partial data now -- delete it ` +
        `(DELETE /courses/${realCourse.id}?confirm=true) before retrying.`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
