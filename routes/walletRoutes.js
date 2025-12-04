import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyWallet, adminGetUserWallet, adminAdjustWallet } from '../controllers/walletController.js';

const router = express.Router();

// User: view own wallet
router.get('/me', protect(['user']), getMyWallet);

// Admin: view specific user wallet
router.get('/user/:userId', protect(['superAdmin', 'admin', 'staffAdmin']), adminGetUserWallet);

// Admin: credit/debit wallet
router.post('/adjust', protect(['superAdmin', 'admin']), adminAdjustWallet);

export default router;
