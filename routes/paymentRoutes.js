import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", protect(["user"]), createOrder);
router.post("/verify", verifyPayment);

export default router;
