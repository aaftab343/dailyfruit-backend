import express from 'express';
import {
  getMySubscriptions,
  getAllSubscriptions,
  updateSubscriptionStatus,
  adminModifySubscription
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect(['user', 'superAdmin', 'admin', 'staffAdmin']), getMySubscriptions);
router.get('/', protect(['superAdmin', 'admin']), getAllSubscriptions);
router.put('/:id/status', protect(['superAdmin', 'admin']), updateSubscriptionStatus);
router.put('/:id/modify', protect(['superAdmin', 'admin']), adminModifySubscription);

export default router;
