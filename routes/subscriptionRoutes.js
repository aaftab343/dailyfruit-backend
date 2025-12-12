// routes/subscriptionRoutes.js
import express from "express";
import {
  getMySubscriptions,
  getMySubscription,
  getMyActiveSubscription,
  getMySubscriptionHistory,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  renewSubscription,
  updateDeliverySchedule,
  getAllSubscriptions,
  updateSubscriptionStatus,
  adminModifySubscription,
} from "../controllers/subscriptionController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================
      USER ROUTES
=============================== */

// Dashboard summary → /api/subscriptions/me
router.get("/me", protect(["user"]), getMySubscription);

// All my subscriptions
router.get("/", protect(["user"]), getMySubscriptions);

// Get only active subscription
router.get("/active", protect(["user"]), getMyActiveSubscription);

// Subscription history
router.get("/history", protect(["user"]), getMySubscriptionHistory);

// Pause / Resume / Cancel / Renew
router.post("/:id/pause", protect(["user"]), pauseSubscription);
router.post("/:id/resume", protect(["user"]), resumeSubscription);
router.post("/:id/cancel", protect(["user"]), cancelSubscription);
router.post("/:id/renew", protect(["user"]), renewSubscription);

// Update delivery schedule  
router.post("/delivery-schedule", protect(["user"]), updateDeliverySchedule);

/* ============================
      ADMIN ROUTES
=============================== */

router.get("/admin/all", protect(["admin"]), getAllSubscriptions);
router.put("/admin/:id/status", protect(["admin"]), updateSubscriptionStatus);
router.put("/admin/:id/modify", protect(["admin"]), adminModifySubscription);

export default router;
