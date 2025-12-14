import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  adminCreateCoupon,
  adminUpdateCoupon,
  adminListCoupons,
  adminToggleCoupon,
  applyCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

/* ================================
   USER
================================ */
router.post("/apply", protect(["user"]), applyCoupon);

/* ================================
   ADMIN
================================ */
router.get("/", protect(["superAdmin", "admin", "staffAdmin"]), adminListCoupons);
router.post("/", protect(["superAdmin", "admin"]), adminCreateCoupon);
router.put("/:id", protect(["superAdmin", "admin"]), adminUpdateCoupon);
router.patch("/:id/toggle", protect(["superAdmin", "admin"]), adminToggleCoupon);

export default router;
