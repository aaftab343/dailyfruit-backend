import express from 'express';
import {
  getMySubscriptions,
  getAllSubscriptions,
  updateSubscriptionStatus,
  adminModifySubscription,
  getMyActiveSubscription,
  getMySubscriptionHistory,

  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  renewSubscription,
  updateDeliverySchedule
} from '../controllers/subscriptionController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// USER ROUTES
router.get('/me', protect(['user','superAdmin','admin','staffAdmin']), getMySubscriptions);
router.get('/my-active', protect(['user','superAdmin','admin','staffAdmin']), getMyActiveSubscription);
router.get('/history', protect(['user','superAdmin','admin','staffAdmin']), getMySubscriptionHistory);

// USER ACTIONS
router.post('/:id/pause', protect(['user']), pauseSubscription);
router.post('/:id/resume', protect(['user']), resumeSubscription);
router.post('/:id/cancel', protect(['user']), cancelSubscription);
router.post('/:id/renew', protect(['user']), renewSubscription);

// Delivery Schedule Update
router.post('/my-schedule/update', protect(['user']), updateDeliverySchedule);

// ADMIN
router.get('/', protect(['superAdmin','admin']), getAllSubscriptions);
router.put('/:id/status', protect(['superAdmin','admin']), updateSubscriptionStatus);
router.put('/:id/modify', protect(['superAdmin','admin']), adminModifySubscription);

export default router;
