import express from 'express';
import { registerTeacher, loginTeacher, logoutTeacher, getMe, updateTeacherSettings } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.post('/logout', logoutTeacher);
router.get('/me', protect, getMe);
router.patch('/settings', protect, updateTeacherSettings);

export default router;
