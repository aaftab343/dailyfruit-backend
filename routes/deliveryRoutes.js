// routes/deliveryRoutes.js
import express from "express";
import {
  createDelivery,
  updateDeliveryStatus,
  getDeliveries,
  getMyDeliveries,
  getMyUpcomingDeliveries,
  getMyPastDeliveries,
} from "../controllers/deliveryController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================== ADMIN ROUTES ==================

// Create a delivery manually (admin panel)
router.post(
  "/",
  protect(["superAdmin", "admin", "staffAdmin"]),
  createDelivery
);

// Update delivery status / notes / assignedTo (admin)
router.put(
  "/:id",
  protect(["superAdmin", "admin", "staffAdmin"]),
  updateDeliveryStatus
);

// Get all deliveries with filters (admin dashboard)
router.get(
  "/",
  protect(["superAdmin", "admin", "staffAdmin"]),
  getDeliveries
);

// ================== USER ROUTES ==================

// Get ALL deliveries for the logged-in user (past + future)
router.get(
  "/me",
  protect(["user", "superAdmin", "admin", "staffAdmin"]),
  getMyDeliveries
);

// Alias, in case frontend calls /my instead of /me
router.get(
  "/my",
  protect(["user", "superAdmin", "admin", "staffAdmin"]),
  getMyDeliveries
);

// Upcoming deliveries (next 7 days)
router.get(
  "/my/upcoming",
  protect(["user", "superAdmin", "admin", "staffAdmin"]),
  getMyUpcomingDeliveries
);

// Past deliveries (before today)
router.get(
  "/my/past",
  protect(["user", "superAdmin", "admin", "staffAdmin"]),
  getMyPastDeliveries
);

export default router;
