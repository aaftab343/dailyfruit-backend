import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  adminListWarehouses,
  adminCreateWarehouse,
  adminUpdateWarehouse,
  adminToggleWarehouse
} from '../controllers/warehouseController.js';

const router = express.Router();

router.get('/', protect(['superAdmin', 'admin', 'staffAdmin']), adminListWarehouses);
router.post('/', protect(['superAdmin', 'admin']), adminCreateWarehouse);
router.put('/:id', protect(['superAdmin', 'admin']), adminUpdateWarehouse);
router.patch('/:id/toggle', protect(['superAdmin', 'admin']), adminToggleWarehouse);

export default router;
