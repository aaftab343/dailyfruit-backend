import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect(['user', 'superAdmin', 'admin', 'staffAdmin']), getProfile);
router.post('/update', protect(['user', 'superAdmin', 'admin', 'staffAdmin']), updateProfile);

export default router;
