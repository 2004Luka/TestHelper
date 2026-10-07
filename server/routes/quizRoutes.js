import { Router } from 'express';
import multer from 'multer';
import {
  createQuiz,
  getAllQuizzes,
  getQuizByCode,
  getFullQuiz,
  toggleQuiz,
  deleteQuiz,
} from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Protected teacher routes (listed first so specific paths like /:shareCode/full are matched correctly)
router.get('/', protect, getAllQuizzes);
router.get('/:shareCode/full', protect, getFullQuiz);
router.patch('/:shareCode/toggle', protect, toggleQuiz);
router.delete('/:shareCode', protect, deleteQuiz);

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'testFile', maxCount: 1 },
    { name: 'answerFile', maxCount: 1 },
  ]),
  createQuiz
);

// Public student routes
router.get('/code/:shareCode', getQuizByCode);
router.get('/:shareCode', getQuizByCode);

export default router;
