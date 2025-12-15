import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";

import generateDeliveriesForSubscription from "../utils/deliveryGenerator.js";

/* ---------- Razorpay client ---------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ------------------------------------
   CREATE ORDER (Coupon Supported)
------------------------------------ */
export const createOrder = async (req, res) => {
  try {
    const { planSlug, couponCode } = req.body;

    if (!planSlug) {
      return res.status(400).json({ message: "Plan slug missing in request" });
    }

    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    let finalAmount = plan.price;
    let couponData = null;

    /* ===============================
       APPLY COUPON (OPTIONAL)
    ================================ */
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
      });

      if (coupon) {
        const now = new Date();

        const isValid =
          (!coupon.validFrom || coupon.validFrom <= now) &&
          (!coupon.validTo || coupon.validTo >= now) &&
          (!coupon.usageLimit || coupon.totalUsed < coupon.usageLimit) &&
          plan.price >= coupon.minAmount &&
          (!coupon.allowedPlanIds?.length ||
            coupon.allowedPlanIds.some(
              (id) => id.toString() === plan._id.toString()
            ));

        if (isValid) {
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
      }
    }

    /* ===============================
       RAZORPAY ORDER
    ================================ */
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: {
        planId: String(plan._id),
        planSlug: plan.slug,
        userId: String(req.user._id),
      },
    });

    /* ===============================
       SAVE PAYMENT
    ================================ */
    const paymentDoc = await Payment.create({
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
      paymentId: paymentDoc._id,
    });
  } catch (err) {
    console.error("createOrder:", err);
    return res.status(500).json({
      message: "Server error",
      details: err.message,
    });
  }
};

/* ------------------------------------
   VERIFY PAYMENT
------------------------------------ */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing razorpay fields" });
    }

    /* ---------- Signature validation ---------- */
    const checkString = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(checkString)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    /* ---------- Find payment ---------- */
    const payment = await Payment.findOne(
      paymentId ? { _id: paymentId } : { razorpayOrderId: razorpay_order_id }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (!payment.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Payment does not belong to user" });
    }

    if (payment.processedForSubscription) {
      return res.json({
        ok: true,
        message: "Already processed",
        subscriptionId: payment.subscriptionId,
      });
    }

    /* ---------- Mark payment success ---------- */
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentInfo = {
      ...(payment.paymentInfo || {}),
      verifiedAt: new Date(),
    };
    await payment.save();

    /* ---------- Increment coupon usage ---------- */
    if (payment.coupon?.couponId) {
      // Global usage
      await Coupon.findByIdAndUpdate(
        payment.coupon.couponId,
        { $inc: { totalUsed: 1 } }
      );

      // Per-user usage
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
    }

    /* ---------- Load user + plan ---------- */
    const user = await User.findById(payment.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = await Plan.findById(payment.planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    /* ---------- Create subscription ---------- */
    const start = new Date();
    const end = new Date(
      start.getTime() + (plan.durationDays || 30) * 86400000
    );

    const totalDeliveries = plan.deliveryCount || 26;
    const allowedDays = plan.deliveryDays?.length
      ? plan.deliveryDays
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const subscription = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      planName: plan.name,
      status: "active",
      startDate: start,
      endDate: end,
      deliveryDays: allowedDays,
      totalDeliveries,
      remainingDeliveries: totalDeliveries,
      originatingPaymentId: payment._id,
    });

    /* ---------- Generate deliveries ---------- */
    let deliveriesResult = { insertedCount: 0, firstDelivery: null };
    try {
      deliveriesResult = await generateDeliveriesForSubscription({
        subscription,
        plan,
      });
    } catch (err) {
      console.error("Delivery generation failed:", err);
    }

    /* ---------- Finalize ---------- */
    user.activeSubscription = subscription._id;
    await user.save();

    payment.processedForSubscription = true;
    payment.subscriptionId = subscription._id;
    await payment.save();

    return res.json({
      ok: true,
      message: "Payment verified & subscription activated",
      subscriptionId: subscription._id,
      nextDelivery: deliveriesResult.firstDelivery,
      deliveriesCreated: deliveriesResult.insertedCount,
    });
  } catch (err) {
    console.error("verifyPayment:", err);
    return res.status(500).json({
      message: "Server error",
      details: err.message,
    });
  }
};

/* ------------------------------------
   GET MY PAYMENTS
------------------------------------ */
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ ok: true, payments });
  } catch (err) {
    console.error("getMyPayments:", err);
    return res.status(500).json({
      message: "Server error",
      details: err.message,
    });
  }
};

/* ------------------------------------
   GET LATEST INVOICE
------------------------------------ */
export const getLatestInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    if (!payment) {
      return res.status(404).json({ message: "No invoice found" });
    }

    const subscription = payment.subscriptionId
      ? await Subscription.findById(payment.subscriptionId).populate("planId")
      : null;

    return res.json({
      ok: true,
      invoice: { payment, subscription },
    });
  } catch (err) {
    console.error("getLatestInvoice:", err);
    return res.status(500).json({
      message: "Server error",
      details: err.message,
    });
  }
};
