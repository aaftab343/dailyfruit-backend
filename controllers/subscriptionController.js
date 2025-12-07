import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";

/* HELPERS */
async function findUserSub(req, res) {
  const sub = await Subscription.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("planId");

  return sub;
}

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
   GET ACTIVE SUB
------------------------------------------ */
export const getMyActiveSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: "active"
    }).populate("planId");

    res.json(sub || null);
  } catch (err) {
    console.error("getMyActiveSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   GET MY HISTORY
------------------------------------------ */
export const getMySubscriptionHistory = async (req, res) => {
  try {
    const history = await Subscription.find({
      userId: req.user._id,
      status: { $in: ["expired", "cancelled"] }
    }).populate("planId");

    res.json(history);
  } catch (err) {
    console.error("getMySubscriptionHistory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN — GET ALL SUBSCRIPTIONS
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
   ADMIN — UPDATE STATUS
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
   ADMIN — MODIFY SUBSCRIPTION
------------------------------------------ */
export const adminModifySubscription = async (req, res) => {
  try {
    const { newPlanId, extendDays, newEndDate } = req.body;

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    if (newPlanId) {
      const plan = await Plan.findById(newPlanId);
      if (!plan) return res.status(400).json({ message: "New plan not found" });

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
    const { pausedUntil } = req.body;

    const sub = await findUserSub(req, res);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.status = "paused";
    sub.pausedAt = new Date();
    sub.pausedUntil = pausedUntil ? new Date(pausedUntil) : null;

    await sub.save();
    res.json({ message: "Subscription paused", subscription: sub });

  } catch (err) {
    console.error("pauseSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: RESUME
------------------------------------------ */
export const resumeSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req, res);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.status = "active";
    sub.pausedAt = null;
    sub.pausedUntil = null;

    // Recalculate next delivery (tomorrow)
    const d = new Date();
    d.setDate(d.getDate() + 1);
    sub.nextDeliveryDate = d;

    await sub.save();
    res.json({ message: "Subscription resumed", subscription: sub });

  } catch (err) {
    console.error("resumeSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   USER: CANCEL
------------------------------------------ */
export const cancelSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req, res);
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
   USER: RENEW SAME PLAN
------------------------------------------ */
export const renewSubscription = async (req, res) => {
  try {
    const sub = await findUserSub(req, res);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const plan = await Plan.findById(sub.planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const start = new Date();
    const end = new Date(start.getTime() + plan.durationDays * 86400000);

    sub.status = "active";
    sub.startDate = start;
    sub.endDate = end;
    sub.nextDeliveryDate = start;
    sub.pausedAt = null;
    sub.pausedUntil = null;
    sub.autoRenew = true;

    await sub.save();
    res.json({ message: "Subscription renewed", subscription: sub });

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
      status: "active"
    });

    if (!sub) return res.status(404).json({ message: "No active subscription" });

    if (deliveryMode) sub.deliveryMode = deliveryMode;
    if (skipDates) sub.skipDates = skipDates;

    await sub.save();

    res.json({ message: "Schedule updated", subscription: sub });

  } catch (err) {
    console.error("updateDeliverySchedule:", err);
    res.status(500).json({ message: "Server error" });
  }
};
