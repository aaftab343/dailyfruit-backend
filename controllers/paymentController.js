import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import { generateInvoicePDF } from '../utils/generateInvoicePDF.js';
import { sendEmail } from '../utils/sendEmail.js';

/* --------------------------------------------------
   SAFE RAZORPAY INITIALIZATION
---------------------------------------------------*/
let rp = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    rp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log("✅ Razorpay initialized successfully");
  } catch (err) {
    console.log("❌ Razorpay initialization error:", err.message);
  }
} else {
  console.log("⚠️ Razorpay keys missing — payments disabled temporarily");
}

/* --------------------------------------------------
   CREATE SUBSCRIPTION HELPER
---------------------------------------------------*/
const createSubscriptionForUser = async ({ userId, plan }) => {
  const duration = plan.durationDays || 30;
  const start = new Date();
  const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

  const sub = await Subscription.create({
    userId,
    planId: plan._id,
    planName: plan.name,
    status: 'active',
    startDate: start,
    endDate: end,
    nextDeliveryDate: start
  });

  return sub;
};

/* --------------------------------------------------
   CREATE ORDER
---------------------------------------------------*/
export const createOrder = async (req, res) => {
  try {
    if (!rp) {
      return res.status(503).json({ message: "Payment gateway temporarily unavailable" });
    }

    const { amount, planSlug } = req.body;
    if (!amount || !planSlug) {
      return res.status(400).json({ message: 'amount and planSlug required' });
    }

    const plan = await Plan.findOne({ slug: planSlug, isActive: true });
    if (!plan) return res.status(400).json({ message: 'Plan not found' });

    const order = await rp.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    });

    await Payment.create({
      userEmail: req.user.email,
      userName: req.user.name,
      userId: req.user._id,
      planId: plan._id,
      planName: plan.name,
      amount,
      status: 'created',
      razorpayOrderId: order.id
    });

    res.json(order);
  } catch (err) {
    console.error("createOrder error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   VERIFY PAYMENT
---------------------------------------------------*/
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid Razorpay signature' });
    }

    const payment = await Payment
      .findOne({ razorpayOrderId: razorpay_order_id })
      .populate('planId');

    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Update payment
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'success';
    await payment.save();

    // Create subscription
    let subscription = null;
    if (payment.userId && payment.planId) {
      subscription = await createSubscriptionForUser({
        userId: payment.userId,
        plan: payment.planId
      });
    }

    // Generate invoice
    let invoiceDoc = null;
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(payment._id.toString().slice(-6)).toUpperCase()}`;
      const pdfPath = await generateInvoicePDF({
        invoiceNumber,
        user: { name: payment.userName, email: payment.userEmail },
        payment,
        subscription
      });

      invoiceDoc = await Invoice.create({
        userId: payment.userId,
        paymentId: payment._id,
        subscriptionId: subscription ? subscription._id : undefined,
        invoiceNumber,
        amount: payment.amount,
        currency: 'INR',
        planName: payment.planName,
        planId: payment.planId?._id || payment.planId,
        startDate: subscription ? subscription.startDate : undefined,
        endDate: subscription ? subscription.endDate : undefined,
        pdfPath
      });
    } catch (invoiceErr) {
      console.error('Invoice generation error:', invoiceErr.message);
    }

    // Email formatting
    const startStr = subscription?.startDate ? new Date(subscription.startDate).toDateString() : '';
    const endStr = subscription?.endDate ? new Date(subscription.endDate).toDateString() : '';

    // User email: payment success
    if (payment.userEmail) {
      const htmlUser = `
        <h2>Payment Successful</h2>
        <p>Hi ${payment.userName || ''},</p>
        <p>Thank you for purchasing <b>${payment.planName}</b>.</p>
        <p>Amount paid: <b>₹${payment.amount}</b></p>
        <p>Payment ID: <b>${razorpay_payment_id}</b></p>
        <p>Order ID: <b>${razorpay_order_id}</b></p>
        ${startStr && endStr ? `<p>Subscription: <b>${startStr}</b> to <b>${endStr}</b></p>` : ''}
        ${invoiceDoc ? `<p>Your invoice is attached.</p>` : ''}
      `;

      let attachments = [];
      if (invoiceDoc?.pdfPath) {
        attachments.push({
          filename: `${invoiceDoc.invoiceNumber}.pdf`,
          path: invoiceDoc.pdfPath
        });
      }

      await sendEmail(payment.userEmail, 'Daily Fruit Payment Successful', htmlUser, attachments);
    }

    // Admin alert email
    if (process.env.ADMIN_NOTIFY_EMAIL) {
      const htmlAdmin = `
        <h2>New Payment Received</h2>
        <p>User: ${payment.userName} (${payment.userEmail})</p>
        <p>Plan: ${payment.planName}</p>
        <p>Amount: ₹${payment.amount}</p>
        <p>Payment ID: ${razorpay_payment_id}</p>
        <p>Order ID: ${razorpay_order_id}</p>
      `;
      await sendEmail(process.env.ADMIN_NOTIFY_EMAIL, 'Daily Fruit - New Payment Alert', htmlAdmin);
    }

    res.json({
      message: 'Payment verified',
      payment,
      subscription,
      invoice: invoiceDoc
    });

  } catch (err) {
    console.error("verifyPayment error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   ADMIN MANUAL PAYMENT
---------------------------------------------------*/
export const adminMarkPaymentPaid = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const { amount, notes } = req.body;
    if (amount) payment.amount = amount;
    if (notes) payment.notes = notes;

    payment.status = 'manual';
    payment.isOffline = true;
    await payment.save();

    if (payment.userId && payment.planId) {
      const exists = await Subscription.findOne({
        userId: payment.userId,
        planId: payment.planId,
        status: 'active'
      });

      if (!exists) {
        const plan = await Plan.findById(payment.planId);
        if (plan) {
          await createSubscriptionForUser({ userId: payment.userId, plan });
        }
      }
    }

    res.json({ message: 'Marked as paid manually', payment });

  } catch (err) {
    console.error("adminMarkPaymentPaid error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
