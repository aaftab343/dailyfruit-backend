import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getActiveCities,
  adminCreateCity,
  adminUpdateCity,
  adminToggleCity
} from '../controllers/cityController.js';

const router = express.Router();

// Public: list active cities
router.get('/', getActiveCities);

// Admin: manage cities
router.post('/', protect(['superAdmin', 'admin']), adminCreateCity);
router.put('/:id', protect(['superAdmin', 'admin']), adminUpdateCity);
router.patch('/:id/toggle', protect(['superAdmin', 'admin']), adminToggleCity);

export default router;
