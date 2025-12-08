// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

// Delivery generator
import { generateDeliveriesForSubscription } from "../utils/deliveryGenerator.js";

/* ------------------------------------
      RAZORPAY INIT
------------------------------------ */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ------------------------------------
      CREATE ORDER
------------------------------------ */
export const createOrder = async (req, res) => {
  try {
    const planSlug = req.body.planSlug || req.body.planslug;

    if (!planSlug) {
      return res.status(400).json({ message: "Plan slug missing in request" });
    }

    const plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const order = await razorpay.orders.create({
      amount: plan.price * 100, // in paise
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    // Save initial payment with status "created"
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
    console.error("createOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------
      VERIFY PAYMENT
------------------------------------ */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    // Verify Razorpay signature
    const checkString = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(checkString)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Find the payment by order id
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment as success
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // Activate subscription
    const plan = await Plan.findById(payment.planId);

    const start = new Date();
    const end = new Date(
      start.getTime() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000
    );

    const subscription = await Subscription.create({
      userId: payment.userId,
      planId: plan._id,
      planName: plan.name,
      status: "active",
      startDate: start,
      endDate: end,
    });

    // Generate deliveries
    await generateDeliveriesForSubscription(subscription._id);

    res.json({
      message: "Payment verified & subscription activated",
      subscriptionId: subscription._id,
    });
  } catch (err) {
    console.error("verifyPayment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------
      GET MY PAYMENTS
------------------------------------ */
export const getMyPayments = async (req, res) => {
  try {
    // Only successful payments for this user
    const payments = await Payment.find({
      userId: req.user._id,
      status: "success",          // 👈 optional but recommended
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error("getMyPayments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------
      LATEST INVOICE (SUMMARY)
------------------------------------ */
export const getLatestInvoice = async (req, res) => {
  try {
    // Latest successful payment for this user
    const payment = await Payment.findOne({
      userId: req.user._id,
      status: "success",          // 👈 optional but recommended
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ message: "No invoice found" });
    }

    // Right now we just return JSON summary.
    // Later you can attach a pdfUrl if you generate PDFs.
    res.json({
      invoiceId: payment._id,
      date: payment.createdAt,
      planName: payment.planName,
      amount: payment.amount,
      status: payment.status,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId || null,
    });
  } catch (err) {
    console.error("getLatestInvoice:", err);
    res.status(500).json({ message: "Server error" });
  }
};
