// routes/adminRoutes.js
import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser
} from "../controllers/adminDashboardController.js";

const router = express.Router();

/**
 * DASHBOARD STATS
 * GET /api/admin/stats
 */
router.get(
  "/stats",
  protectAdmin(["SUPER_ADMIN", "MANAGER", "SUPPORT"]),
  getDashboardStats
);

/**
 * USERS
 * GET /api/admin/users
 */
router.get(
  "/users",
  protectAdmin(["SUPER_ADMIN", "MANAGER"]),
  getAllUsers
);

/**
 * UPDATE USER
 * PUT /api/admin/users/:id
 */
router.put(
  "/users/:id",
  protectAdmin(["SUPER_ADMIN", "MANAGER"]),
  updateUser
);

/**
 * DELETE USER
 * DELETE /api/admin/users/:id
 */
router.delete(
  "/users/:id",
  protectAdmin(["SUPER_ADMIN"]),
  deleteUser
);

export default router;
