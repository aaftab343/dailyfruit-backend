import express from 'express';
import { sendSignupOtp, verifySignupOtp } from '../controllers/otpController.js';

const router = express.Router();

router.post('/send', sendSignupOtp);
router.post('/verify', verifySignupOtp);

export default router;
