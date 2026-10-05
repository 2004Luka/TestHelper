import { Router } from 'express';
import {
  submitQuiz,
  getSubmissions,
  exportSubmissions,
} from '../controllers/submissionController.js';

const router = Router();

router.post('/', submitQuiz);
router.get('/:shareCode', getSubmissions);
router.get('/:shareCode/export', exportSubmissions);

export default router;
