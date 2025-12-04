import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getBasicAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Admin-only dashboard analytics
router.get('/basic', protect(['superAdmin', 'admin', 'staffAdmin']), getBasicAnalytics);

export default router;
