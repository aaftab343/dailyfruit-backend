import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyReferralInfo, adminListReferrals } from '../controllers/referralController.js';

const router = express.Router();

// User: see referral code + stats
router.get('/me', protect(['user']), getMyReferralInfo);

// Admin: list referrals
router.get('/', protect(['superAdmin', 'admin', 'staffAdmin']), adminListReferrals);

export default router;
