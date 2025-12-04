import express from 'express';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/planController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPlans);
router.post('/', protect(['superAdmin', 'admin']), createPlan);
router.put('/:id', protect(['superAdmin', 'admin']), updatePlan);
router.delete('/:id', protect(['superAdmin']), deletePlan);

export default router;
