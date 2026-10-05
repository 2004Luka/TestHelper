import Comment from '../models/Comment.js';
import Quiz from '../models/Quiz.js';
import { z } from 'zod';

const commentSchema = z.object({
  shareCode: z.string().min(1),
  author: z.string().min(1).max(100).trim(),
  role: z.enum(['teacher', 'student']).optional().default('student'),
  message: z.string().min(1).max(2000).trim(),
  questionIndex: z.number().int().optional().default(-1),
  submissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional()
});

// POST /api/comments — Add a discussion comment
export const addComment = async (req, res, next) => {
  try {
    const validationResult = commentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, message: 'Invalid input data', errors: validationResult.error.errors });
    }
    
    const { shareCode, author, role, message, questionIndex, submissionId } = validationResult.data;

    const quiz = await Quiz.findOne({ shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const comment = await Comment.create({
      quizId: quiz._id,
      submissionId: submissionId || undefined,
      author,
      role: role || 'student',
      message,
      questionIndex: questionIndex ?? -1,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

// GET /api/comments/:shareCode — All comments for a quiz
export const getComments = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const comments = await Comment.find({ quizId: quiz._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};
