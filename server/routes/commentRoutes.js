import { Router } from 'express';
import { addComment, getComments } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Discussion routes restricted to authenticated teachers
router.post('/', protect, addComment);
router.get('/:shareCode', protect, getComments);

export default router;
