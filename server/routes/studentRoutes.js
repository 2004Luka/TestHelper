import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getPublicTeachers,
  getTeacherPublicInfo,
  getTeacherClassesPublic,
  registerStudent,
  loginStudent,
  createStudentPasswordResetLink,
  resetStudentPassword,
  logoutStudent,
  getStudentMe,
  joinClassByCode,
  getStudentQuizzes,
} from '../controllers/studentAuthController.js';
import { protect, protectStudent } from '../middleware/authMiddleware.js';

const router = Router();
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
});

// Public routes for student discovery & auth
router.get('/teachers', getPublicTeachers);
router.get('/teachers/:teacherId', getTeacherPublicInfo);
router.get('/teachers/:teacherId/classes', getTeacherClassesPublic);
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/password-reset', passwordResetLimiter, resetStudentPassword);
router.post('/teacher/:studentId/password-reset', protect, createStudentPasswordResetLink);
router.post('/logout', logoutStudent);

// Protected student routes
router.get('/me', protectStudent, getStudentMe);
router.post('/join-class', protectStudent, joinClassByCode);
router.get('/my-quizzes', protectStudent, getStudentQuizzes);

export default router;
