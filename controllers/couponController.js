import Coupon from '../models/Coupon.js';
import Payment from '../models/Payment.js';

const isCouponValidForNow = (coupon) => {
  const now = new Date();
  if (!coupon.active) return false;
  if (coupon.validFrom && coupon.validFrom > now) return false;
  if (coupon.validTo && coupon.validTo < now) return false;
  if (coupon.usageLimit && coupon.totalUsed >= coupon.usageLimit) return false;
  return true;
};

export const adminCreateCoupon = async (req, res) => {
  try {
    const data = req.body;
    data.code = data.code?.toUpperCase();
    const existing = await Coupon.findOne({ code: data.code });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create(data);
    res.status(201).json(coupon);
  } catch (err) {
    console.error('adminCreateCoupon error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.code) data.code = data.code.toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    console.error('adminUpdateCoupon error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminListCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error('adminListCoupons error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminToggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    coupon.active = !coupon.active;
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    console.error('adminToggleCoupon error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code, amount, planId } = req.body;
    if (!code || !amount) {
      return res.status(400).json({ message: 'code and amount are required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    if (!isCouponValidForNow(coupon)) {
      return res.status(400).json({ message: 'Coupon is not valid at this time' });
    }

    if (coupon.allowedPlanIds?.length && planId) {
      const allowed = coupon.allowedPlanIds.some((id) => id.toString() === String(planId));
      if (!allowed) {
        return res.status(400).json({ message: 'Coupon not applicable for this plan' });
      }
    }

    // TODO: per-user usage count can be implemented by separate model or user usage field
    // For now we only honor usageLimit & active & date

    let discount = 0;
    if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'percent') {
      discount = (Number(amount) * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    if (discount <= 0) {
      return res.status(400).json({ message: 'Coupon does not provide discount for this amount' });
    }

    const finalAmount = Math.max(0, Number(amount) - discount);

    // Do not increment totalUsed here; only after successful payment
    res.json({
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      discount,
      finalAmount
    });
  } catch (err) {
    console.error('applyCoupon error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
