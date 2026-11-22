import { Router } from 'express';
import { getTutorWorkspace, saveTutorWorkspace } from '../controllers/tutorDashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/', getTutorWorkspace);
router.put('/', saveTutorWorkspace);

export default router;
