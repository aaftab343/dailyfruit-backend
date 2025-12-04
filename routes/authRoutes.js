import express from 'express';
import { signup, login, startOtpLogin, verifyOtpLogin, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/login-otp/start', startOtpLogin);
router.post('/login-otp/verify', verifyOtpLogin);
router.get('/me', protect(['user', 'superAdmin', 'admin', 'staffAdmin']), getMe);

export default router;
