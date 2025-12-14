import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import { getAdminOrders } from "../controllers/adminOrdersController.js";

const router = express.Router();

/**
 * GET /api/admin/orders
 */
router.get(
  "/",
  protectAdmin(["SUPER_ADMIN", "MANAGER"]),
  getAdminOrders
);

export default router;
