// routes/deliveryRoutes.js
import express from 'express';
import {
  createDelivery,
  updateDeliveryStatus,
  getDeliveries,
  getMyDeliveries,
  getMyUpcomingDeliveries,
  getMyDeliveryHistory,
  skipMyDelivery,
} from '../controllers/deliveryController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// =========== ADMIN ROUTES ===========

// Create a delivery (admin)
router.post(
  '/',
  protect(['superAdmin', 'admin', 'staffAdmin']),
  createDelivery
);

// Update delivery status/notes/assignedTo/proofImage (admin)
router.put(
  '/:id',
  protect(['superAdmin', 'admin', 'staffAdmin']),
  updateDeliveryStatus
);

// Get all deliveries with filters (admin)
router.get(
  '/',
  protect(['superAdmin', 'admin', 'staffAdmin']),
  getDeliveries
);

// =========== USER ROUTES ===========

// All deliveries for logged-in user (past + future)
router.get(
  '/me',
  protect(['user', 'superAdmin', 'admin', 'staffAdmin']),
  getMyDeliveries
);

// Used by dashboard for "Upcoming Deliveries (7 days)"
// Frontend: GET /api/deliveries/upcoming
router.get(
  '/upcoming',
  protect(['user', 'superAdmin', 'admin', 'staffAdmin']),
  getMyUpcomingDeliveries
);

// Used by dashboard for "Past Deliveries"
// Frontend: GET /api/deliveries/history
router.get(
  '/history',
  protect(['user', 'superAdmin', 'admin', 'staffAdmin']),
  getMyDeliveryHistory
);

// Used by "Skip" button on dashboard
// Frontend: POST /api/deliveries/skip/:id
router.post(
  '/skip/:id',
  protect(['user', 'superAdmin', 'admin', 'staffAdmin']),
  skipMyDelivery
);

export default router;
