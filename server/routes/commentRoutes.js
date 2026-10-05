import { Router } from 'express';
import { addComment, getComments } from '../controllers/commentController.js';

const router = Router();

router.post('/', addComment);
router.get('/:shareCode', getComments);

export default router;
