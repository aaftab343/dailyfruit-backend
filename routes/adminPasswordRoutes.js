import express from 'express';
import { requestAdminPasswordReset, resetAdminPassword } from '../controllers/adminPasswordController.js';

const router = express.Router();

router.post('/forgot', requestAdminPasswordReset);
router.post('/reset', resetAdminPassword);

export default router;
