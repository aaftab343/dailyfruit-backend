import Coupon from "../models/Coupon.js";
import Payment from "../models/Payment.js";

/* ================================
   HELPERS
================================ */

const isCouponValidForNow = (coupon) => {
  const now = new Date();

  if (!coupon.active) return false;
  if (coupon.validFrom && coupon.validFrom > now) return false;
  if (coupon.validTo && coupon.validTo < now) return false;

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.totalUsed >= coupon.usageLimit
  ) {
    return false;
  }

  return true;
};

/* ================================
   ADMIN CONTROLLERS
================================ */

// CREATE
export const adminCreateCoupon = async (req, res) => {
  try {
    const data = req.body;

    if (!data.code || !data.discountType || !data.discountValue || !data.validTo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    data.code = data.code.toUpperCase();

    const existing = await Coupon.findOne({ code: data.code });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create(data);
    res.status(201).json(coupon);
  } catch (err) {
    console.error("adminCreateCoupon error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE
export const adminUpdateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.code) data.code = data.code.toUpperCase();

    const coupon = await Coupon.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (err) {
    console.error("adminUpdateCoupon error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LIST
export const adminListCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error("adminListCoupons error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// TOGGLE ACTIVE
export const adminToggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.active = !coupon.active;
    await coupon.save();

    res.json(coupon);
  } catch (err) {
    console.error("adminToggleCoupon error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   USER: APPLY COUPON
================================ */

export const applyCoupon = async (req, res) => {
  try {
    const { code, amount, planId } = req.body;

    if (!code || amount === undefined) {
      return res.status(400).json({ message: "code and amount are required" });
    }

    const orderAmount = Number(amount);
    if (isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (!isCouponValidForNow(coupon)) {
      return res.status(400).json({ message: "Coupon is not valid at this time" });
    }

    // Minimum order value
    if (coupon.minAmount && orderAmount < coupon.minAmount) {
      return res.status(400).json({
        message: `Minimum order amount ₹${coupon.minAmount} required`,
      });
    }

    // Plan restriction
    if (coupon.allowedPlanIds?.length > 0) {
      if (!planId) {
        return res.status(400).json({ message: "Coupon requires a plan" });
      }

      const allowed = coupon.allowedPlanIds.some(
        (id) => id.toString() === String(planId)
      );

      if (!allowed) {
        return res.status(400).json({
          message: "Coupon not applicable for this plan",
        });
      }
    }

    /* ================================
       DISCOUNT CALCULATION
    ================================ */

    let discount = 0;

    if (coupon.discountType === "flat") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "percent") {
      discount = Math.floor((orderAmount * coupon.discountValue) / 100);

      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    if (discount <= 0) {
      return res.status(400).json({
        message: "Coupon does not provide discount for this order",
      });
    }

    const finalAmount = Math.max(0, orderAmount - discount);

    // IMPORTANT:
    // ❌ Do NOT increment usage here
    // ✅ Increment ONLY after successful payment

    res.json({
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      discount,
      finalAmount,
    });
  } catch (err) {
    console.error("applyCoupon error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
