// controllers/subscriptionController.js
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import Delivery from "../models/Delivery.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { generateDeliveriesForSubscription } from "../utils/deliveryGenerator.js";

/* HELPER */
async function findUserSub(req) {
  return await Subscription.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("planId");
}

/**
 * GET /api/subscriptions/me
 * Returns summary for the logged-in user:
 *  - subscription (active subscription or null)
 *  - nextDelivery (closest scheduled delivery >= today) or null
 *  - upcomingCount (count of upcoming scheduled deliveries)
 *  - recentPayments (last 5 payments)
 */
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    // Try user.activeSubscription first if available
    let subscription = null;
    const user = await User.findById(userId).select("activeSubscription").lean();
    if (user && user.activeSubscription) {
      subscription = await Subscription.findById(user.activeSubscription)
        .populate("planId")
        .lean();
    }

    // Fallback to latest active subscription
    if (!subscription) {
      subscription = await Subscription.findOne({ userId, status: "active" })
        .populate("planId")
        .sort({ createdAt: -1 })
        .lean();
    }

    // If no subscription, return recent payments only
    if (!subscription) {
      const recentPayments = await Payment.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
      return res.json({ subscription: null, nextDelivery: null, upcomingCount: 0, recentPayments });
    }

    // Find next scheduled delivery (>= today)
    const today = new Date();
    today.setHours(0,0,0,0);

    const nextDelivery = await Delivery.findOne({
      subscriptionId: subscription._id,
      deliveryDate: { $gte: today },
      status: { $in: ["scheduled", "pending", "out_for_delivery"] }
    }).sort({ deliveryDate: 1 }).lean();

    const upcomingCount = await Delivery.countDocuments({
      subscriptionId: subscription._id,
      deliveryDate: { $gte: today },
      status: { $in: ["scheduled", "pending", "out_for_delivery"] }
    });

    const recentPayments = await Payment.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();

    return res.json({
      subscription,
      nextDelivery: nextDelivery || null,
      upcomingCount,
      recentPayments
    });
  } catch (err) {
    console.error("getMySubscription error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* -----------------------------------------
   GET ALL MY SUBSCRIPTIONS
------------------------------------------ */
export const getMySubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user._id }).populate("planId");
    res.json(subs);
  } catch (err) {
    console.error("getMySubscriptions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ACTIVE SUB
------------------------------------------ */
export const getMyActiveSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    }).populate("planId");

    res.json(sub || null);
  } catch (err) {
    console.error("getMyActiveSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   MY HISTORY
------------------------------------------ */
export const getMySubscriptionHistory = async (req, res) => {
  try {
    const history = await Subscription.find({
      userId: req.user._id,
      status: { $in: ["expired", "cancelled"] },
    }).populate("planId");

    res.json(history);
  } catch (err) {
    console.error("getMySubscriptionHistory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN: GET ALL SUBS
------------------------------------------ */
export const getAllSubscriptions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.planId) filter.planId = req.query.planId;

    const subs = await Subscription.find(filter)
      .populate("userId", "name email phone")
      .populate("planId", "name price");

    res.json(subs);
  } catch (err) {
    console.error("getAllSubscriptions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN: UPDATE STATUS
------------------------------------------ */
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    res.json(sub);
  } catch (err) {
    console.error("updateSubscriptionStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN MODIFY
------------------------------------------ */
export const adminModifySubscription = async (req, res) => {
  try {
    const { newPlanId, extendDays, newEndDate } = req.body;

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    if (newPlanId) {
      const plan = await Plan.findById(newPlanId);
      if (!plan) return res.status(404).json({ message: "New plan not found" });

      sub.planId = plan._id;
      sub.planName = plan.name;
    }

    if (extendDays) {
      sub.endDate = new Date(sub.endDate.getTime() + extendDays * 86400000);
    }

    if (newEndDate) {
      sub.endDate = new Date(newEndDate);
    }

    await sub.save();
    res.json(sub);
  } catch (err) {
    console.error("adminModifySubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: PAUSE SUBSCRIPTION
------------------------------------------ */
export const pauseSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.status = "paused";
    sub.pausedAt = new Date();
    await sub.save();

    res.json({ message: "Subscription paused", subscription: sub });
  } catch (err) {
    console.error("pauseSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: RESUME SUBSCRIPTION
------------------------------------------ */
export const resumeSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.status = "active";
    sub.pausedAt = null;
    await sub.save();

    const plan = await Plan.findById(sub.planId);
    await generateDeliveriesForSubscription(sub, plan);

    res.json({
      message: "Subscription resumed",
      subscription: sub,
    });
  } catch (err) {
    console.error("resumeSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: CANCEL SUBSCRIPTION
------------------------------------------ */
export const cancelSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.status = "cancelled";
    sub.cancelledAt = new Date();

    await sub.save();
    res.json({ message: "Subscription cancelled", subscription: sub });
  } catch (err) {
    console.error("cancelSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: RENEW SUBSCRIPTION
------------------------------------------ */
export const renewSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const plan = await Plan.findById(sub.planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const start = new Date();
    const end = new Date(start.getTime() + plan.durationDays * 86400000);

    sub.status = "active";
    sub.startDate = start;
    sub.endDate = end;
    sub.pausedAt = null;

    await sub.save();
    await generateDeliveriesForSubscription(sub, plan);

    res.json({
      message: "Subscription renewed",
      subscription: sub,
    });
  } catch (err) {
    console.error("renewSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: UPDATE DELIVERY SCHEDULE
------------------------------------------ */
export const updateDeliverySchedule = async (req, res) => {
  try {
    const { deliveryMode, skipDates } = req.body;

    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (!sub) return res.status(404).json({ message: "No active subscription found" });

    if (deliveryMode) sub.deliveryMode = deliveryMode;
    if (skipDates) sub.skipDates = skipDates;

    await sub.save();

    res.json({ message: "Delivery schedule updated", subscription: sub });
  } catch (err) {
    console.error("updateDeliverySchedule:", err);
    res.status(500).json({ message: "Server error" });
  }
};
