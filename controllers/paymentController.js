import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";

import generateDeliveriesForSubscription from "../utils/deliveryGenerator.js";
import { sendEmail } from "../utils/emailService.js";

/* ---------- Razorpay client ---------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ====================================
   CREATE ORDER (Coupon Supported)
==================================== */
export const createOrder = async (req, res) => {
  try {
    const { planSlug, couponCode } = req.body;

    if (!planSlug) {
      return res.status(400).json({ message: "Plan slug missing" });
    }

    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    let finalAmount = plan.price;
    let couponData = null;

    /* ---------- APPLY COUPON (STRICT VALIDATION) ---------- */
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
      });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon" });
      }

      const now = new Date();

      if (coupon.totalUsed >= coupon.usageLimit) {
        return res.status(400).json({
          message: "Coupon usage limit reached",
        });
      }

      if (coupon.validFrom > now || coupon.validTo < now) {
        return res.status(400).json({
          message: "Coupon expired or not active yet",
        });
      }

      if (plan.price < coupon.minAmount) {
        return res.status(400).json({
          message: `Minimum order ₹${coupon.minAmount} required`,
        });
      }

      if (
        coupon.allowedPlanIds?.length &&
        !coupon.allowedPlanIds.some(
          (id) => id.toString() === plan._id.toString()
        )
      ) {
        return res.status(400).json({
          message: "Coupon not applicable for this plan",
        });
      }

      if (coupon.perUserLimit) {
        const usage = await CouponUsage.findOne({
          couponId: coupon._id,
          userId: req.user._id,
        });

        if (usage && usage.usedCount >= coupon.perUserLimit) {
          return res.status(400).json({
            message: "You have already used this coupon",
          });
        }
      }

      let discount = 0;
      if (coupon.discountType === "flat") {
        discount = coupon.discountValue;
      } else {
        discount = Math.floor(
          (plan.price * coupon.discountValue) / 100
        );
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      }

      if (discount > 0) {
        finalAmount = Math.max(0, plan.price - discount);
        couponData = {
          couponId: coupon._id,
          code: coupon.code,
          discount,
          originalAmount: plan.price,
        };
      }
    }

    /* ---------- CREATE RAZORPAY ORDER ---------- */
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: {
        planId: String(plan._id),
        userId: String(req.user._id),
      },
    });

    /* ---------- SAVE PAYMENT ---------- */
    const payment = await Payment.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      planId: plan._id,
      planName: plan.name,
      amount: finalAmount,
      currency: "INR",
      coupon: couponData,
      status: "created",
      razorpayOrderId: order.id,
    });

    return res.json({
      ok: true,
      orderId: order.id,
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ====================================
   VERIFY PAYMENT (IMPORTANT)
==================================== */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay fields" });
    }

    /* ---------- VERIFY SIGNATURE ---------- */
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    /* ---------- LOAD PAYMENT ---------- */
    const payment = await Payment.findOne(
      paymentId ? { _id: paymentId } : { razorpayOrderId: razorpay_order_id }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (!payment.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized payment" });
    }

    if (payment.processedForSubscription) {
      return res.json({
        ok: true,
        message: "Already processed",
        subscriptionId: payment.subscriptionId,
      });
    }

    /* ---------- MARK PAYMENT SUCCESS ---------- */
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentInfo = { verifiedAt: new Date() };
    await payment.save();

    /* ---------- INCREMENT COUPON USAGE (FINAL & SAFE) ---------- */
    if (payment.coupon?.couponId) {
      const coupon = await Coupon.findByIdAndUpdate(
        payment.coupon.couponId,
        { $inc: { totalUsed: 1 } },
        { new: true }
      );

      await CouponUsage.findOneAndUpdate(
        {
          couponId: payment.coupon.couponId,
          userId: payment.userId,
        },
        {
          $inc: { usedCount: 1 },
          $set: { lastUsedAt: new Date() },
        },
        { upsert: true }
      );

      // Auto-disable coupon if exhausted
      if (coupon.totalUsed >= coupon.usageLimit) {
        coupon.active = false;
        await coupon.save();
      }
    }

    /* ---------- CREATE SUBSCRIPTION ---------- */
    const user = await User.findById(payment.userId);
    const plan = await Plan.findById(payment.planId);

    const start = new Date();
    const end = new Date(
      start.getTime() + (plan.durationDays || 30) * 86400000
    );

    const subscription = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      planName: plan.name,
      status: "active",
      startDate: start,
      endDate: end,
      deliveryDays: plan.deliveryDays || ["Mon","Tue","Wed","Thu","Fri","Sat"],
      totalDeliveries: plan.deliveryCount || 26,
      remainingDeliveries: plan.deliveryCount || 26,
      originatingPaymentId: payment._id,
    });

    await generateDeliveriesForSubscription({ subscription, plan });

    user.activeSubscription = subscription._id;
    await user.save();

    payment.processedForSubscription = true;
    payment.subscriptionId = subscription._id;
    await payment.save();

    /* ---------- CONFIRMATION EMAIL ---------- */
    try {
      await sendEmail(
        user.email,
        "Order Confirmed – Daily Fruit Co 🥝",
        `<p>Your ${plan.name} subscription is active.</p>`
      );
    } catch (e) {}

    return res.json({
      ok: true,
      message: "Payment verified & subscription activated",
      subscriptionId: subscription._id,
    });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
