import express from 'express';
import { createOrder, verifyPayment, adminMarkPaymentPaid } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect(['user', 'superAdmin', 'admin', 'staffAdmin']), createOrder);
router.post('/verify', verifyPayment);
router.put('/:id/manual-paid', protect(['superAdmin', 'admin']), adminMarkPaymentPaid);

export default router;
