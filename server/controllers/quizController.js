import Quiz from '../models/Quiz.js';
import Submission from '../models/Submission.js';
import Comment from '../models/Comment.js';
import {
  parseTestDocument,
  parseAnswerKey,
  mergeQuestionsWithAnswers,
} from '../utils/wordParser.js';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';

// POST /api/quizzes — Create quiz from two uploaded Word files
export const createQuiz = async (req, res, next) => {
  try {
    const { title, settings } = req.body;
    const testFile = req.files?.testFile?.[0];
    const answerFile = req.files?.answerFile?.[0];

    if (!testFile || !answerFile) {
      return res
        .status(400)
        .json({ success: false, message: 'Both test and answer files are required' });
    }

    const questions = await parseTestDocument(testFile.path);
    const answers = await parseAnswerKey(answerFile.path);

    if (questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No questions found in the test file. Check formatting.' });
    }

    const mergedQuestions = mergeQuestionsWithAnswers(questions, answers);
    const shareCode = nanoid(8);

    const quiz = await Quiz.create({
      title: title || 'Untitled Quiz',
      questions: mergedQuestions,
      shareCode,
      settings: settings ? JSON.parse(settings) : {},
    });

    // Cleanup temp uploads
    await fs.unlink(testFile.path).catch(() => {});
    await fs.unlink(answerFile.path).catch(() => {});

    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes — List all quizzes with submission counts
export const getAllQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 }).lean();

    const withStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const submissionCount = await Submission.countDocuments({ quizId: quiz._id });
        return { ...quiz, submissionCount };
      })
    );

    res.json({ success: true, data: withStats });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:shareCode — Student-safe quiz (no correct answers)
export const getQuizByCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    if (!quiz.isActive) {
      return res.status(403).json({ success: false, message: 'This quiz has been disabled by the teacher' });
    }

    // Strip correct answers before sending to student
    const safe = quiz.toObject();
    safe.questions = safe.questions.map(({ correctAnswer, ...q }) => q);

    res.json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:shareCode/full — Teacher view with answers
export const getFullQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quizzes/:shareCode/toggle — Enable/disable quiz link
export const toggleQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quizzes/:shareCode — Remove quiz + all related data
export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ shareCode: req.params.shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    await Submission.deleteMany({ quizId: quiz._id });
    await Comment.deleteMany({ quizId: quiz._id });

    res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) {
    next(err);
  }
};
