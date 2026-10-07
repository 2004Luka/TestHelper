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

// POST /api/quizzes — Create quiz from two uploaded Word files (Teacher protected)
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

    let parsedSettings = {};
    if (settings) {
      if (typeof settings === 'string') {
        try {
          parsedSettings = JSON.parse(settings);
        } catch (e) {
          parsedSettings = {};
        }
      } else if (typeof settings === 'object') {
        parsedSettings = settings;
      }
    }

    const quiz = await Quiz.create({
      teacher: req.teacher?._id,
      title: title || 'Untitled Quiz',
      questions: mergedQuestions,
      shareCode,
      settings: parsedSettings,
    });

    // Cleanup temp uploads
    await fs.unlink(testFile.path).catch(() => {});
    await fs.unlink(answerFile.path).catch(() => {});

    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes — List teacher's own quizzes with submission counts (Teacher protected)
export const getAllQuizzes = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quizzes = await Quiz.find({ teacher: req.teacher._id })
      .sort({ createdAt: -1 })
      .lean();

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

// GET /api/quizzes/code/:shareCode — Student-safe quiz (no correct answers) (Public)
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

// GET /api/quizzes/:shareCode/full — Teacher view with answers (Teacher protected)
export const getFullQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quizzes/:shareCode/toggle — Enable/disable quiz link (Teacher protected)
export const toggleQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quizzes/:shareCode — Remove quiz + all related data (Teacher protected)
export const deleteQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOneAndDelete({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    await Submission.deleteMany({ quizId: quiz._id });
    await Comment.deleteMany({ quizId: quiz._id });

    res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) {
    next(err);
  }
};
