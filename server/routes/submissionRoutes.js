import { Router } from 'express';
import {
  submitQuiz,
  getSubmissions,
  exportSubmissions,
} from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', submitQuiz);
router.get('/:shareCode', protect, getSubmissions);
router.get('/:shareCode/export', protect, exportSubmissions);

export default router;
