import { Router } from 'express';
import { getMyProfile, getPlatformProfile, updateMyProfile } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/me', authMiddleware, getMyProfile);
router.patch('/me', authMiddleware, updateMyProfile);
router.get('/:userId/platform-profile', authMiddleware, getPlatformProfile);

export default router;
