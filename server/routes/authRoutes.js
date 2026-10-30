import express from 'express';
import { registerTeacher, loginTeacher, logoutTeacher, getMe, getSession, updateTeacherSettings } from '../controllers/authController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.post('/logout', logoutTeacher);
router.get('/session', optionalAuth, getSession);
router.get('/me', protect, getMe);
router.patch('/settings', protect, updateTeacherSettings);

export default router;
