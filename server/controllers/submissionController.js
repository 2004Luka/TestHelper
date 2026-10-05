import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import { z } from 'zod';

const submitQuizSchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  studentName: z.string().min(1, 'Student name is required').max(100, 'Name is too long').trim(),
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0),
    selectedAnswer: z.string().optional().default('')
  }))
});

// POST /api/submissions — Student submits quiz answers, gets instant grading
export const submitQuiz = async (req, res, next) => {
  try {
    const validationResult = submitQuizSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, message: 'Invalid input data', errors: validationResult.error.errors });
    }
    
    const { shareCode, studentName, answers } = validationResult.data;

    const quiz = await Quiz.findOne({ shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    if (!quiz.isActive) {
      return res.status(403).json({ success: false, message: 'This quiz is no longer active' });
    }

    // Grade each answer
    let score = 0;
    const graded = answers.map((ans) => {
      const question = quiz.questions[ans.questionIndex];
      if (!question) return { ...ans, isCorrect: false };

      const isCorrect =
        question.correctAnswer.toLowerCase().trim() ===
        (ans.selectedAnswer || '').toLowerCase().trim();

      if (isCorrect) score++;
      return { ...ans, isCorrect };
    });

    // Track attempt number per student
    const prevAttempts = await Submission.countDocuments({
      quizId: quiz._id,
      studentName: studentName.trim(),
    });

    const submission = await Submission.create({
      quizId: quiz._id,
      studentName: studentName.trim(),
      answers: graded,
      score,
      totalQuestions: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      attemptNumber: prevAttempts + 1,
    });

    // Build detailed result with correct answers for student review
    const resultData = {
      ...submission.toObject(),
      questions: quiz.questions.map((q, i) => {
        const studentAns = graded.find((a) => a.questionIndex === i);
        return {
          questionText: q.questionText,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          studentAnswer: studentAns?.selectedAnswer || '',
          isCorrect: studentAns?.isCorrect || false,
        };
      }),
    };

    res.status(201).json({ success: true, data: resultData });
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:shareCode — All submissions for a quiz
export const getSubmissions = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const submissions = await Submission.find({ quizId: quiz._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: submissions });
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:shareCode/export — Download results as CSV
export const exportSubmissions = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
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
