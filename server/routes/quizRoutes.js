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

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post(
  '/',
  upload.fields([
    { name: 'testFile', maxCount: 1 },
    { name: 'answerFile', maxCount: 1 },
  ]),
  createQuiz
);

router.get('/', getAllQuizzes);
router.get('/:shareCode', getQuizByCode);
router.get('/:shareCode/full', getFullQuiz);
router.patch('/:shareCode/toggle', toggleQuiz);
router.delete('/:shareCode', deleteQuiz);

export default router;
