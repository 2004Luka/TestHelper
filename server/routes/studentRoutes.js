import { Router } from 'express';
import {
  getPublicTeachers,
  getTeacherPublicInfo,
  getTeacherClassesPublic,
  registerStudent,
  loginStudent,
  logoutStudent,
  getStudentMe,
  joinClassByCode,
  getStudentQuizzes,
} from '../controllers/studentAuthController.js';
import { protectStudent } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes for student discovery & auth
router.get('/teachers', getPublicTeachers);
router.get('/teachers/:teacherId', getTeacherPublicInfo);
router.get('/teachers/:teacherId/classes', getTeacherClassesPublic);
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/logout', logoutStudent);

// Protected student routes
router.get('/me', protectStudent, getStudentMe);
router.post('/join-class', protectStudent, joinClassByCode);
router.get('/my-quizzes', protectStudent, getStudentQuizzes);

export default router;
