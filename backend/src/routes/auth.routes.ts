import { Router } from 'express';
import { register, login, getMe, refresh } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/refresh', refresh);

export default router;
