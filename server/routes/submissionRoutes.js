import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitQuiz,
  getSubmissions,
  exportSubmissions,
  deleteSubmission,
} from '../controllers/submissionController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Anti-abuse limiter on public quiz submissions: max 10 per 5 minutes per IP
const submitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions from this IP. Please wait a few minutes before submitting again.' },
});

router.post('/', submitLimiter, optionalAuth, submitQuiz);
router.get('/:shareCode', protect, getSubmissions);
router.get('/:shareCode/export', protect, exportSubmissions);
router.delete('/:id', protect, deleteSubmission);

export default router;
