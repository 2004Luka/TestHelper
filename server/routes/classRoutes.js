import { Router } from 'express';
import {
  getTeacherClasses,
  createClass,
  deleteClass,
  getTeacherStudents,
  assignStudentClass,
  removeStudent,
  getQuizAccessControl,
  updateQuizAccessControl,
} from '../controllers/classController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All class routes are protected for teachers
router.use(protect);

router.get('/', getTeacherClasses);
router.post('/', createClass);
router.delete('/:classId', deleteClass);

router.get('/students', getTeacherStudents);
router.patch('/students/:studentId/assign', assignStudentClass);
router.delete('/students/:studentId', removeStudent);

router.get('/quiz-access/:shareCode', getQuizAccessControl);
router.patch('/quiz-access/:shareCode', updateQuizAccessControl);

export default router;
