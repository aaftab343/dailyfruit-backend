import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  adminCreateCoupon,
  adminUpdateCoupon,
  adminListCoupons,
  adminToggleCoupon,
  applyCoupon,
} from "../controllers/couponController.js";
import CouponUsage from "../models/CouponUsage.js";

const router = express.Router();

/* ================================
   USER ROUTES
================================ */

// Apply coupon at checkout
router.post(
  "/apply",
  protect(["user"]),
  applyCoupon
);

/* ================================
   ADMIN ROUTES
================================ */

// List all coupons
router.get(
  "/",
  protect(["superAdmin", "admin", "staffAdmin"]),
  adminListCoupons
);

// Create coupon
router.post(
  "/",
  protect(["superAdmin", "admin"]),
  adminCreateCoupon
);

// Update coupon
router.put(
  "/:id",
  protect(["superAdmin", "admin"]),
  adminUpdateCoupon
);

// Enable / Disable coupon
router.patch(
  "/:id/toggle",
  protect(["superAdmin", "admin"]),
  adminToggleCoupon
);

// ✅ NEW — Coupon usage per user
router.get(
  "/:id/usage",
  protect(["superAdmin", "admin"]),
  async (req, res) => {
    try {
      const usage = await CouponUsage.find({
        couponId: req.params.id,
      }).populate("userId", "email name");

      res.json(usage);
    } catch (err) {
      console.error("Coupon usage error:", err);
      res.status(500).json({ message: "Failed to load coupon usage" });
    }
  }
);

export default router;
