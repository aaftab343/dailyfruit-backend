import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyPayments,
  getLatestInvoice
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();   // ✅ FIXED (MUST HAVE ())

// Routes
router.post("/create-order", protect(['user']), createOrder);
router.post("/verify", protect(['user']), verifyPayment);

// Extra APIs
router.get("/my-payments", protect(['user']), getMyPayments);
router.get("/latest-invoice", protect(['user']), getLatestInvoice);

export default router;
