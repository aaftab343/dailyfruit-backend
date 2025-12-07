import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

// ⭐ Auto Delivery Generator
import { generateDeliveriesForSubscription } from "../utils/deliveryGenerator.js";

/* ---------------------------
   RAZORPAY INIT (LIVE MODE)
---------------------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------------------------
   CREATE ORDER
---------------------------- */
export const createOrder = async (req, res) => {
  try {
    // Accept both planSlug or planslug
    const planSlug = req.body.planSlug || req.body.planslug;

    if (!planSlug) {
      return res.status(400).json({ message: "Plan slug missing in request" });
    }

    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
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
      amount: plan.price,
      status: "created",
      razorpayOrderId: order.id,
    });

    res.json({
      orderId: order.id,
      amount: plan.price * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("createOrder:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------
   VERIFY PAYMENT
---------------------------- */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    const checkString = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(checkString)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment status
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    const plan = await Plan.findById(payment.planId);

    // Create Subscription
    const start = new Date();
    const end = new Date(
      start.getTime() +
        (plan.durationDays || 30) * 24 * 60 * 60 * 1000
    );

    const sub = await Subscription.create({
      userId: payment.userId,
      planId: plan._id,
      planName: plan.name,
      status: "active",
      startDate: start,
      endDate: end,
