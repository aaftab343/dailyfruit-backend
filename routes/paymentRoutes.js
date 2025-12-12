// routes/paymentRoutes.js
import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyPayments,
  getLatestInvoice,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  BASE PATH (set in server.js / app.js):
  app.use("/api/payments", router);

  Endpoints:
  POST   /api/payments/create-order
  POST   /api/payments/verify
  GET    /api/payments/           -> getMyPayments
  GET    /api/payments/my-payments
  GET    /api/payments/latest-invoice
*/

// Create Razorpay order for a plan
router.post("/create-order", protect(["user"]), createOrder);

// Verify Razorpay payment & activate subscription
router.post("/verify", protect(["user"]), verifyPayment);

// Get all payments for logged-in user
router.get("/", protect(["user"]), getMyPayments);          // main list
router.get("/my-payments", protect(["user"]), getMyPayments); // alias

// Get latest invoice info (currently based on latest payment)
router.get("/latest-invoice", protect(["user"]), getLatestInvoice);

export default router;
