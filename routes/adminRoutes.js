import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getPayments
} from '../controllers/adminDashboardController.js';

const router = express.Router();

router.get('/stats', protect(['superAdmin', 'admin']), getDashboardStats);
router.get('/users', protect(['superAdmin', 'admin']), getAllUsers);
router.put('/users/:id', protect(['superAdmin', 'admin']), updateUser);
router.delete('/users/:id', protect(['superAdmin']), deleteUser);
router.get('/payments', protect(['superAdmin', 'admin']), getPayments);

export default router;
