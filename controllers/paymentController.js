import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

/* ---------------------------------------------
   INIT RAZORPAY (LIVE MODE)
---------------------------------------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------------------------------------------
   CREATE ORDER
---------------------------------------------- */
export const createOrder = async (req, res) => {
  try {
    const { planSlug } = req.body;

    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const amount = plan.price;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    // Save order in DB
    await Payment.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      planId: plan._id,
      planName: plan.name,
      amount,
      status: "created",
      razorpayOrderId: order.id,
    });

    res.json({
      orderId: order.id,
      amount: amount * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      plan: {
        name: plan.name,
        price: plan.price,
        slug: plan.slug,
      },
    });
  } catch (err) {
    console.error("createOrder:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------------------------
   VERIFY PAYMENT
---------------------------------------------- */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // Signature check
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Find payment in DB
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // Create subscription
    const plan = await Plan.findById(payment.planId);
    const duration = plan.durationDays || 30;

    const start = new Date();
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

    const sub = await Subscription.create({
      userId: payment.userId,
      planId: payment.planId,
      planName: payment.planName,
      status: "active",
      startDate: start,
      endDate: end,
      nextDeliveryDate: start,
    });

    res.json({
      message: "Payment verified",
      paymentId: razorpay_payment_id,
      subscription: sub,
    });
  } catch (err) {
    console.error("verifyPayment:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
