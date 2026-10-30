import { Router } from 'express';
import multer from 'multer';
import mongoSanitize from 'express-mongo-sanitize';
import {
  createQuiz,
  getAllQuizzes,
  getQuizByCode,
  getFullQuiz,
  toggleQuiz,
  deleteQuiz,
  restoreQuiz,
} from '../controllers/quizController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024, files: 2, fields: 4, fieldSize: 64 * 1024 },
});

// Protected teacher routes (listed first so specific paths like /:shareCode/full are matched correctly)
router.get('/', protect, getAllQuizzes);
router.get('/:shareCode/full', protect, getFullQuiz);
router.patch('/:shareCode/toggle', protect, toggleQuiz);
router.patch('/:shareCode/restore', protect, restoreQuiz);
router.delete('/:shareCode', protect, deleteQuiz);

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'testFile', maxCount: 1 },
    { name: 'answerFile', maxCount: 1 },
  ]),
  mongoSanitize(),
  createQuiz
);

// Public student routes (with optional student/teacher authentication)
router.get('/code/:shareCode', optionalAuth, getQuizByCode);
router.get('/:shareCode', optionalAuth, getQuizByCode);

export default router;
