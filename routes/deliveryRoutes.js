import express from 'express';
import {
  createDelivery,
  updateDeliveryStatus,
  getDeliveries,
  getMyDeliveries
} from '../controllers/deliveryController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ADMIN ROUTES
router.post('/', protect(['superAdmin', 'admin', 'staffAdmin']), createDelivery);
router.put('/:id', protect(['superAdmin', 'admin', 'staffAdmin']), updateDeliveryStatus);
router.get('/', protect(['superAdmin', 'admin', 'staffAdmin']), getDeliveries);

// USER ROUTE
router.get('/me', protect(['user', 'superAdmin', 'admin', 'staffAdmin']), getMyDeliveries);

export default router;
