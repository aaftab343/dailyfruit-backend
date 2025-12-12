// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";

import generateDeliveriesForSubscription from "../utils/deliveryGenerator.js";

/* ---------- Razorpay client ---------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------- Helper: next delivery dates (used only if needed) ---------- */
const DAYS = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
function nextDeliveryDates(startDate = new Date(), count = 26, allowedDays = ['Mon','Tue','Wed','Thu','Fri','Sat']) {
  const allowedNums = new Set(allowedDays.map(d => DAYS[d]));
  const res = [];
  let dt = new Date(startDate);
  dt.setHours(0,0,0,0);
  while (res.length < count) {
    if (allowedNums.has(dt.getDay())) res.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return res;
}

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

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: Math.round((plan.price || 0) * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: { planId: String(plan._id), planSlug: plan.slug || "", userId: String(req.user._id) }
    });

    // Save initial payment (status: created)
    const paymentDoc = await Payment.create({
      userId: req.user._id,
      userEmail: req.user.email || "",
      userName: req.user.name || "",
      planId: plan._id,
      planName: plan.name || "",
      amount: plan.price || 0,
      currency: "INR",
      status: "created",
      razorpayOrderId: order.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.json({
      ok: true,
      orderId: order.id,
      amount: Math.round((plan.price || 0) * 100),
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: paymentDoc._id
    });
  } catch (err) {
    console.error("createOrder:", err);
    return res.status(500).json({ message: "Server error", details: err.message });
  }
};

/* ------------------------------------
   VERIFY PAYMENT (idempotent)
------------------------------------ */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing razorpay fields" });
    }

    // verify signature
    const checkString = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(checkString)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { expected: expectedSignature, provided: razorpay_signature });
      return res.status(400).json({ message: "Invalid signature" });
    }

    // find payment document (by paymentId or razorpayOrderId)
    const paymentQuery = paymentId ? { _id: paymentId } : { razorpayOrderId: razorpay_order_id };
    const payment = await Payment.findOne(paymentQuery);

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (!payment.userId.equals(req.user._id)) {
      // extra safety: payment must belong to requesting user
      return res.status(403).json({ message: "Payment does not belong to user" });
    }

    // idempotency: if already processed -> return
    if (payment.processedForSubscription) {
      return res.json({ ok: true, message: "Already processed", subscriptionId: payment.subscriptionId || null });
    }

    // mark payment success and attach provider fields
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentInfo = payment.paymentInfo || {};
    payment.paymentInfo.verifiedAt = new Date();
    payment.updatedAt = new Date();
    await payment.save();

    // load user & plan
    const user = await User.findById(payment.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = await Plan.findById(payment.planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // compute subscription details
    const start = new Date();
    const end = new Date(start.getTime() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000);
    const totalDeliveries = plan.deliveryCount || plan.billingDaysPerMonth || 26;
    const allowedDays = Array.isArray(plan.deliveryDays) && plan.deliveryDays.length ? plan.deliveryDays : ['Mon','Tue','Wed','Thu','Fri','Sat'];

    // create subscription
    const subscription = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      planName: plan.name || "",
      status: "active",
      startDate: start,
      endDate: end,
      deliveryDays: allowedDays,
      totalDeliveries,
      remainingDeliveries: totalDeliveries,
      originatingPaymentId: payment._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // generate deliveries (bulk insert) using the utility
    // IMPORTANT: pass the actual subscription and plan objects (not only IDs)
    let deliveriesResult = { insertedCount: 0, firstDelivery: null, datesPlanned: [] };
    try {
      deliveriesResult = await generateDeliveriesForSubscription({ subscription, plan });
    } catch (genErr) {
      // don't crash the whole request — log and continue
      console.error("generateDeliveriesForSubscription error:", genErr);
    }

    // update user.activeSubscription
    user.activeSubscription = subscription._id;
    user.updatedAt = new Date();
    await user.save();

    // update payment as processed
    payment.processedForSubscription = true;
    payment.subscriptionId = subscription._id;
    await payment.save();

    // respond with subscription info
    return res.json({
      ok: true,
      message: "Payment verified & subscription activated",
      subscriptionId: subscription._id,
      nextDelivery: deliveriesResult.firstDelivery,
      deliveriesCreated: deliveriesResult.insertedCount
    });

  } catch (err) {
    console.error("verifyPayment:", err);
    return res.status(500).json({ message: "Server error", details: err.message });
  }
};

/* ------------------------------------
   GET MY PAYMENTS
------------------------------------ */
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200);
    return res.json({ ok: true, payments });
  } catch (err) {
    console.error("getMyPayments:", err);
    return res.status(500).json({ message: "Server error", details: err.message });
  }
};

/* ------------------------------------
   GET LATEST INVOICE (SUMMARY)
------------------------------------ */
export const getLatestInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ message: "No invoice found" });

    // try to get subscription summary
    let subscription = null;
    if (payment.subscriptionId) {
      subscription = await Subscription.findById(payment.subscriptionId).populate('planId');
    } else {
      const user = await User.findById(req.user._id);
      if (user?.activeSubscription) {
        subscription = await Subscription.findById(user.activeSubscription).populate('planId');
      }
    }

    const invoice = {
      payment,
      subscription: subscription ? {
        _id: subscription._id,
        planName: subscription.planName,
        nextDeliveryDate: subscription.nextDeliveryDate,
        remainingDeliveries: subscription.remainingDeliveries,
        totalDeliveries: subscription.totalDeliveries,
        plan: subscription.planId ? {
          _id: subscription.planId._id,
          name: subscription.planId.name,
          price: subscription.planId.price,
          imageUrl: subscription.planId.imageUrl
        } : null
      } : null
    };

    return res.json({ ok: true, invoice });
  } catch (err) {
    console.error("getLatestInvoice:", err);
    return res.status(500).json({ message: "Server error", details: err.message });
  }
};
