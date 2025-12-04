import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  deliveryBoyRegister,
  deliveryBoyLogin,
  adminListDeliveryBoys
} from '../controllers/deliveryBoyController.js';

const router = express.Router();

// Public endpoints for delivery app
router.post('/register', deliveryBoyRegister);
router.post('/login', deliveryBoyLogin);

// Admin view
router.get('/', protect(['superAdmin', 'admin', 'staffAdmin']), adminListDeliveryBoys);

export default router;
