import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getPayments
} from "../controllers/adminDashboardController.js";

const router = express.Router();

/**
 * DASHBOARD STATS
 * GET /api/admin/stats
 */
router.get(
  "/stats",
  protect(["superAdmin", "admin"]),
  getDashboardStats
);

/**
 * USERS
 * GET /api/admin/users
 */
router.get(
  "/users",
  protect(["superAdmin", "admin"]),
  getAllUsers
);

/**
 * UPDATE USER
 * PUT /api/admin/users/:id
 */
router.put(
  "/users/:id",
  protect(["superAdmin", "admin"]),
  updateUser
);

/**
 * DELETE USER (SUPER ADMIN ONLY)
 * DELETE /api/admin/users/:id
 */
router.delete(
  "/users/:id",
  protect(["superAdmin"]),
  deleteUser
);

/**
 * PAYMENTS
 * GET /api/admin/payments
 */
router.get(
  "/payments",
  protect(["superAdmin", "admin"]),
  getPayments
);

export default router;
