import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminToggleBanner
} from '../controllers/cmsController.js';

const router = express.Router();

// Public: active banners
router.get('/banners', getBanners);

// Admin CMS for banners
router.post('/banners', protect(['superAdmin', 'admin']), adminCreateBanner);
router.put('/banners/:id', protect(['superAdmin', 'admin']), adminUpdateBanner);
router.patch('/banners/:id/toggle', protect(['superAdmin', 'admin']), adminToggleBanner);

export default router;
