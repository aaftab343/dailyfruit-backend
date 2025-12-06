// routes/subscriptionRoutes.js
import express from 'express';
import {
  getMySubscriptions,
  getAllSubscriptions,
  updateSubscriptionStatus,
  adminModifySubscription,
  getMyActiveSubscription,
  getMySubscriptionHistory
} from '../controllers/subscriptionController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// USER
router.get('/me', protect(['user','superAdmin','admin','staffAdmin']), getMySubscriptions);
router.get('/my-active', protect(['user','superAdmin','admin','staffAdmin']), getMyActiveSubscription);
router.get('/history', protect(['user','superAdmin','admin','staffAdmin']), getMySubscriptionHistory);

// ADMIN
router.get('/', protect(['superAdmin','admin']), getAllSubscriptions);
router.put('/:id/status', protect(['superAdmin','admin']), updateSubscriptionStatus);
router.put('/:id/modify', protect(['superAdmin','admin']), adminModifySubscription);

export default router;
