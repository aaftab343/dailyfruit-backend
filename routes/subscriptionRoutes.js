// routes/subscriptionRoutes.js
import express from "express";
import {
  getMySubscriptions,
  getMySubscription,
  getMyActiveSubscription,
  getMySubscriptionHistory,
  getAllSubscriptions,
  updateSubscriptionStatus,
  adminModifySubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  renewSubscription,
  updateDeliverySchedule
} from "../controllers/subscriptionController.js";

import { protect } from "../middleware/authMiddleware.js"; // adapt to your project

const router = express.Router();

// User routes
router.get("/", protect(["user"]), getMySubscriptions);          // list all user's subs
router.get("/me", protect(["user"]), getMySubscription);        // <-- dashboard summary
router.get("/active", protect(["user"]), getMyActiveSubscription);
router.get("/history", protect(["user"]), getMySubscriptionHistory);

router.post("/:id/pause", protect(["user"]), pauseSubscription);
router.post("/:id/resume", protect(["user"]), resumeSubscription);
router.post("/:id/cancel", protect(["user"]), cancelSubscription);
router.post("/:id/renew", protect(["user"]), renewSubscription);
router.post("/delivery-schedule", protect(["user"]), updateDeliverySchedule);

// Admin routes (protect accordingly)
router.get("/admin/all", protect(["admin"]), getAllSubscriptions);
router.put("/admin/:id/status", protect(["admin"]), updateSubscriptionStatus);
router.put("/admin/:id/modify", protect(["admin"]), adminModifySubscription);

export default router;
