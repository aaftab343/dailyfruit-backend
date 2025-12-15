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

// Apply coupon at checkout (USER ONLY)
router.post(
  "/apply",
  protect(["user"]),
  applyCoupon
);

/* ================================
   ADMIN ROUTES
================================ */

// ✅ LIST COUPONS
router.get(
  "/",
  protect(["superAdmin", "admin", "staffAdmin", "MANAGER"]),
  adminListCoupons
);

// ✅ CREATE COUPON
router.post(
  "/",
  protect(["superAdmin", "admin", "staffAdmin", "MANAGER"]),
  adminCreateCoupon
);

// ✅ UPDATE COUPON
router.put(
  "/:id",
  protect(["superAdmin", "admin", "staffAdmin", "MANAGER"]),
  adminUpdateCoupon
);

// ✅ TOGGLE COUPON (ACTIVE / INACTIVE)
router.patch(
  "/:id/toggle",
  protect(["superAdmin", "admin", "staffAdmin", "MANAGER"]),
  adminToggleCoupon
);

// ✅ COUPON USAGE PER USER
router.get(
  "/:id/usage",
  protect(["superAdmin", "admin", "staffAdmin", "MANAGER"]),
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
