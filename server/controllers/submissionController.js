import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import Comment from '../models/Comment.js';
import { z } from 'zod';
import { evaluateStudentQuizAccess } from '../utils/quizAccess.js';

const submitQuizSchema = z.object({
  shareCode: z.string().min(1, 'Share code is required').max(32).trim(),
  studentName: z
    .string()
    .min(1, 'Student name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z0-9\s\u10A0-\u10FF\.\-_']+$/, 'Student name contains invalid characters')
    .trim(),
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0).max(500),
        selectedAnswer: z.string().max(1000).optional().default(''),
      })
    )
    .max(500),
});

// POST /api/submissions — Student submits quiz answers, gets instant grading (Public)
export const submitQuiz = async (req, res, next) => {
  try {
    const validationResult = submitQuizSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, message: 'Invalid input data', errors: validationResult.error.errors });
    }
    
    const { shareCode, studentName, answers } = validationResult.data;

    const quiz = await Quiz.findOne({ shareCode });
    if (!quiz || quiz.isDeleted) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    // Access control check via priority hierarchy
    const accessEvaluation = evaluateStudentQuizAccess(quiz, req.student);
    if (!accessEvaluation.hasAccess) {
      return res.status(403).json({
        success: false,
        requiresLogin: accessEvaluation.requiresLogin,
        accessDenied: true,
        message: accessEvaluation.message,
      });
    }

    const trimmedName = student ? student.name : studentName.trim();

    // Prevent automated rapid-fire resubmissions (10-second debounce per student name)
    const recentSub = await Submission.findOne({
      quizId: quiz._id,
      studentName: trimmedName,
      createdAt: { $gte: new Date(Date.now() - 10 * 1000) },
    });
    if (recentSub) {
      return res.status(429).json({ success: false, message: 'Please wait at least 10 seconds between attempts' });
    }

    // Grade each answer safely bound to actual quiz questions
    let score = 0;
    const graded = answers
      .filter((ans) => ans.questionIndex >= 0 && ans.questionIndex < quiz.questions.length)
      .map((ans) => {
        const question = quiz.questions[ans.questionIndex];
        if (!question) return { ...ans, isCorrect: false };

        const qAns = (question.correctAnswer || '').toLowerCase().trim();
        const sAns = (ans.selectedAnswer || '').toLowerCase().trim();
        const isCorrect = qAns !== '' && qAns === sAns;

        if (isCorrect) score++;
        return { ...ans, isCorrect };
      });

    // Track attempt number per student
    const prevAttempts = await Submission.countDocuments({
      quizId: quiz._id,
      studentName: trimmedName,
    });

    const submission = await Submission.create({
      quizId: quiz._id,
      studentName: trimmedName,
      student: student ? student._id : null,
      class: student?.class ? (student.class._id || student.class) : null,
      answers: graded,
      score,
      totalQuestions: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      attemptNumber: prevAttempts + 1,
    });

    // Determine whether to reveal full answer key based on teacher settings
    const showDetails = quiz.settings?.showScoreImmediately === true;

    // Build student-safe result object
    const resultData = {
      _id: submission._id,
      quizId: submission.quizId,
      studentName: submission.studentName,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      percentage: submission.percentage,
      attemptNumber: submission.attemptNumber,
      createdAt: submission.createdAt,
      questions: quiz.questions.map((q, i) => {
        const studentAns = graded.find((a) => a.questionIndex === i);
        return {
          questionText: q.questionText,
          type: q.type,
          options: q.options,
          // Only expose correct answer if teacher settings explicitly permit it
          correctAnswer: showDetails ? q.correctAnswer : undefined,
          studentAnswer: studentAns?.selectedAnswer || '',
          isCorrect: showDetails ? (studentAns?.isCorrect || false) : undefined,
        };
      }),
    };

    res.status(201).json({ success: true, data: resultData });
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:shareCode — All submissions for a quiz (Teacher protected)
export const getSubmissions = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode, teacher: req.teacher._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    const submissions = await Submission.find({ quizId: quiz._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: submissions });
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:shareCode/export — Download results as CSV (Teacher protected)
export const exportSubmissions = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode, teacher: req.teacher._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    const submissions = await Submission.find({ quizId: quiz._id })
      .sort({ studentName: 1, attemptNumber: 1 })
      .lean();

    let csv = 'Student Name,Attempt,Score,Total Questions,Percentage,Submitted At\n';
    for (const s of submissions) {
      csv += `"${s.studentName}",${s.attemptNumber},${s.score},${s.totalQuestions},${s.percentage}%,${new Date(s.createdAt).toLocaleString()}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${quiz.title.replace(/\s+/g, '_')}_results.csv`
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/submissions/:id — Delete a single student submission (Teacher protected)
export const deleteSubmission = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Ensure the submission belongs to a quiz owned by this teacher
    const quiz = await Quiz.findOne({ _id: submission.quizId, teacher: req.teacher._id });
    if (!quiz) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this submission' });
    }

    await Submission.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ submissionId: req.params.id });

    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (err) {
    next(err);
  }
};
